import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private registry = new Registry();

  private evaluatesTotal = new Counter({
    name: 'evaluates_total',
    help: 'Total number of evaluations',
    registers: [this.registry],
  });

  private cacheHitTotal = new Counter({
    name: 'cache_hit_total',
    help: 'Total cache hits',
    registers: [this.registry],
  });

  private ruleMatchTotal = new Counter({
    name: 'rule_match_total',
    help: 'Total matched rules',
    registers: [this.registry],
  });

  private latency = new Histogram({
    name: 'evaluate_latency_ms',
    help: 'Evaluation latency in ms',
    buckets: [5, 10, 25, 50, 100, 200, 500, 1000],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  incEvaluates() {
    this.evaluatesTotal.inc();
  }

  incCacheHit() {
    this.cacheHitTotal.inc();
  }

  incRuleMatch() {
    this.ruleMatchTotal.inc();
  }

  observeLatency(ms: number) {
    this.latency.observe(ms);
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
