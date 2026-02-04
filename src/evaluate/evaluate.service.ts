import { Injectable, Logger } from '@nestjs/common';
import { Rule, Feature } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
import { bucket, stableHashInt } from '../common/hash.util';
import { matchesConditions, Subject } from '../common/conditions.util';
import { MetricsService } from '../metrics/metrics.service';

export type EvaluateResult = {
  enabled: boolean;
  variant?: { key: string } | null;
  ruleId?: string | null;
  reason: string;
  ttlSeconds: number;
};

@Injectable()
export class EvaluateService {
  private readonly logger = new Logger(EvaluateService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private metrics: MetricsService,
  ) {}

  private ttlSeconds(): number {
    const min = Number(process.env.CACHE_TTL_MIN_SECONDS || 30);
    const max = Number(process.env.CACHE_TTL_MAX_SECONDS || 120);
    if (Number.isNaN(min) || Number.isNaN(max) || max <= min) return 60;
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  private scheduleAllows(rule: Rule, now: Date): boolean {
    if (!rule.schedule) return true;
    const schedule = rule.schedule as { startAt?: string; endAt?: string };
    if (schedule.startAt && now < new Date(schedule.startAt)) return false;
    if (schedule.endAt && now > new Date(schedule.endAt)) return false;
    return true;
  }

  private evaluateRule(
    feature: Feature,
    rule: Rule,
    subject: Subject,
  ): { enabled: boolean; variantKey?: string; reason: string } {
    const subjectKey = subject.key;

    if (!this.scheduleAllows(rule, new Date())) return { enabled: false, reason: 'schedule' };

    const conditions = rule.conditions as any;
    if (!matchesConditions(subject, conditions)) return { enabled: false, reason: 'conditions' };

    if (rule.ruleType === 'global') {
      const enabled = rule.rolloutPercent === null || rule.rolloutPercent > 0;
      return { enabled, reason: 'global' };
    }

    if (rule.ruleType === 'segment') {
      return { enabled: true, reason: 'segment' };
    }

    if (rule.ruleType === 'percentage') {
      const percent = rule.rolloutPercent ?? 0;
      const value = bucket(`${feature.key}:${subjectKey}`, 100);
      return { enabled: value < percent, reason: 'percentage' };
    }

    if (rule.ruleType === 'variant') {
      const variants = (rule.variants as any[]) || [];
      if (!Array.isArray(variants) || variants.length === 0) {
        return { enabled: false, reason: 'variant_empty' };
      }

      const totalWeight = variants.reduce((acc, v) => acc + (v.weight || 0), 0);
      if (totalWeight <= 0) return { enabled: false, reason: 'variant_weight_zero' };

      const bucketValue = bucket(`${feature.key}:${subjectKey}:${rule.id}`, totalWeight);
      let cursor = 0;

      for (const variant of variants) {
        cursor += variant.weight || 0;
        if (bucketValue < cursor) {
          return { enabled: true, variantKey: variant.key, reason: 'variant' };
        }
      }

      return { enabled: false, reason: 'variant_fallback' };
    }

    return { enabled: false, reason: 'unknown' };
  }

  private decisionHash(input: string): number {
    return stableHashInt(input);
  }

  async evaluate(featureKey: string, environment: string, subject: Subject) {
    const start = Date.now();
    this.metrics.incEvaluates();

    let feature: Feature | null = null;
    let rules: Rule[] = [];

    try {
      feature = await this.prisma.feature.findFirst({
        where: { key: featureKey, environment: environment as any },
      });

      if (!feature) {
        return { result: this.disabled('feature_not_found'), matchedRuleId: null, decisionHash: 0 };
      }

      if (feature.isArchived) {
        return { result: this.disabled('feature_archived'), matchedRuleId: null, decisionHash: 0 };
      }

      rules = await this.prisma.rule.findMany({
        where: { featureId: feature.id, enabled: true },
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
      });
    } catch (err) {
      const failOpen = String(process.env.FAIL_OPEN || 'false') === 'true';
      const result = failOpen ? this.enabled('fail_open') : this.disabled('db_unavailable');
      return { result, matchedRuleId: null, decisionHash: 0 };
    }

    const ttl = this.ttlSeconds();
    const redis = this.redis.getClient();
    const cacheKey = `eval:${feature.key}:${feature.environment}:${subject.key}:${feature.rulesVersion}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        this.metrics.incCacheHit();
        const parsed = JSON.parse(cached);
        this.metrics.observeLatency(Date.now() - start);

        return {
          result: parsed,
          matchedRuleId: parsed.ruleId ?? null,
          decisionHash: 0,
          cacheHit: true,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Cache get failed: ${err.message}`);
    }

    let matchedRuleId: string | null = null;
    let enabled = false;
    let variantKey: string | null = null;
    let reason = 'no_rule';

    for (const rule of rules) {
      const evaluation = this.evaluateRule(feature, rule, subject);
      if (evaluation.reason === 'conditions' || evaluation.reason === 'schedule') {
        continue;
      }

      matchedRuleId = rule.id;
      enabled = evaluation.enabled;
      reason = evaluation.reason;
      variantKey = evaluation.variantKey ?? null;
      this.metrics.incRuleMatch();
      break;
    }

    const decisionHash = this.decisionHash(
      `${feature.key}:${environment}:${subject.key}:${String(enabled)}:${variantKey ?? ''}:${matchedRuleId ?? ''}`,
    );

    const result: EvaluateResult = {
      enabled,
      variant: variantKey ? { key: variantKey } : null,
      ruleId: matchedRuleId,
      reason,
      ttlSeconds: ttl,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', ttl);
    } catch (err: any) {
      this.logger.warn(`Cache set failed: ${err.message}`);
    }

    try {
      await this.prisma.evaluation.create({
        data: {
          featureKey: feature.key,
          environment: feature.environment,
          subjectKey: subject.key,
          subject,
          resultEnabled: enabled,
          variantKey: variantKey,
          matchedRuleId,
          reason,
          decisionHash,
        },
      });
    } catch (err) {
      this.logger.warn('Evaluation persist failed');
    }

    this.metrics.observeLatency(Date.now() - start);
    return { result, matchedRuleId, decisionHash };
  }

  private disabled(reason: string): EvaluateResult {
    return { enabled: false, variant: null, ruleId: null, reason, ttlSeconds: 0 };
  }

  private enabled(reason: string): EvaluateResult {
    return { enabled: true, variant: null, ruleId: null, reason, ttlSeconds: 0 };
  }
}
