import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../common/redis.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

import { Injectable } from '@nestjs/common';

@Injectable()
export class FeaturesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private redis: RedisService,
  ) {}

  async createFeature(dto: CreateFeatureDto, actorApiKeyId?: string | null) {
    try {
      const feature = await this.prisma.feature.create({
        data: {
          key: dto.key,
          description: dto.description,
          environment: dto.environment as any,
          isArchived: dto.isArchived ?? false,
        },
      });
      await this.audit.logEvent({
        actorApiKeyId: actorApiKeyId ?? null,
        action: 'feature.create',
        entityType: 'feature',
        entityId: feature.id,
        metadata: { key: feature.key, environment: feature.environment },
      });
      return feature;
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('Feature key already exists');
      }
      throw err;
    }
  }

  async listFeatures() {
    return this.prisma.feature.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeature(id: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { id },
      include: { rules: true },
    });
    if (!feature) throw new NotFoundException('Feature not found');
    return feature;
  }

  async updateFeature(id: string, dto: UpdateFeatureDto, actorApiKeyId?: string | null) {
    const feature = await this.prisma.feature.update({
      where: { id },
      data: {
        description: dto.description,
        isArchived: dto.isArchived,
      },
    });
    await this.bumpRulesVersion(feature.id, feature.key, feature.environment);
    await this.audit.logEvent({
      actorApiKeyId: actorApiKeyId ?? null,
      action: 'feature.update',
      entityType: 'feature',
      entityId: feature.id,
      metadata: { key: feature.key },
    });
    return feature;
  }

  async archiveFeature(id: string, actorApiKeyId?: string | null) {
    const feature = await this.prisma.feature.update({
      where: { id },
      data: { isArchived: true },
    });
    await this.bumpRulesVersion(feature.id, feature.key, feature.environment);
    await this.audit.logEvent({
      actorApiKeyId: actorApiKeyId ?? null,
      action: 'feature.archive',
      entityType: 'feature',
      entityId: feature.id,
      metadata: { key: feature.key },
    });
    return feature;
  }

  async createRule(featureId: string, dto: CreateRuleDto, actorApiKeyId?: string | null) {
    const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) throw new NotFoundException('Feature not found');

    const rule = await this.prisma.rule.create({
      data: {
        featureId,
        priority: dto.priority,
        ruleType: dto.ruleType as any,
        enabled: dto.enabled ?? true,
        rolloutPercent: dto.rolloutPercent,
        variants: dto.variants,
        conditions: dto.conditions,
        schedule: dto.schedule,
      },
    });

    await this.bumpRulesVersion(feature.id, feature.key, feature.environment);
    await this.audit.logEvent({
      actorApiKeyId: actorApiKeyId ?? null,
      action: 'rule.create',
      entityType: 'rule',
      entityId: rule.id,
      metadata: { featureId },
    });

    return rule;
  }

  async listRules(featureId: string) {
    return this.prisma.rule.findMany({
      where: { featureId },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  async getRule(featureId: string, ruleId: string) {
    const rule = await this.prisma.rule.findFirst({
      where: { id: ruleId, featureId },
    });
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }

  async updateRule(
    featureId: string,
    ruleId: string,
    dto: UpdateRuleDto,
    actorApiKeyId?: string | null,
  ) {
    const existing = await this.prisma.rule.findFirst({ where: { id: ruleId, featureId } });
    if (!existing) throw new NotFoundException('Rule not found');
    const rule = await this.prisma.rule.update({
      where: { id: ruleId },
      data: {
        priority: dto.priority,
        ruleType: dto.ruleType as any,
        enabled: dto.enabled,
        rolloutPercent: dto.rolloutPercent,
        variants: dto.variants,
        conditions: dto.conditions,
        schedule: dto.schedule,
      },
    });

    const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
    if (feature) {
      await this.bumpRulesVersion(feature.id, feature.key, feature.environment);
    }

    await this.audit.logEvent({
      actorApiKeyId: actorApiKeyId ?? null,
      action: 'rule.update',
      entityType: 'rule',
      entityId: rule.id,
      metadata: { featureId },
    });

    return rule;
  }

  async disableRule(featureId: string, ruleId: string, actorApiKeyId?: string | null) {
    const existing = await this.prisma.rule.findFirst({ where: { id: ruleId, featureId } });
    if (!existing) throw new NotFoundException('Rule not found');

    const rule = await this.prisma.rule.update({
      where: { id: ruleId },
      data: { enabled: false },
    });

    const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
    if (feature) {
      await this.bumpRulesVersion(feature.id, feature.key, feature.environment);
    }

    await this.audit.logEvent({
      actorApiKeyId: actorApiKeyId ?? null,
      action: 'rule.disable',
      entityType: 'rule',
      entityId: rule.id,
      metadata: { featureId },
    });

    return rule;
  }

  async deleteRule(featureId: string, ruleId: string, actorApiKeyId?: string | null) {
    const existing = await this.prisma.rule.findFirst({ where: { id: ruleId, featureId } });
    if (!existing) throw new NotFoundException('Rule not found');

    const rule = await this.prisma.rule.delete({ where: { id: ruleId } });
    const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
    if (feature) {
      await this.bumpRulesVersion(feature.id, feature.key, feature.environment);
    }

    await this.audit.logEvent({
      actorApiKeyId: actorApiKeyId ?? null,
      action: 'rule.delete',
      entityType: 'rule',
      entityId: rule.id,
      metadata: { featureId },
    });

    return rule;
  }

  async bumpRulesVersion(featureId: string, featureKey: string, environment: string) {
    const updated = await this.prisma.feature.update({
      where: { id: featureId },
      data: { rulesVersion: { increment: 1 } },
    });

    const redis = this.redis.getClient();
    const versionKey = `rulesVersion:${featureKey}:${environment}`;
    try {
      await redis.set(versionKey, String(updated.rulesVersion));
    } catch {
      // best-effort cache update
    }

    return updated.rulesVersion;
  }
}
