import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  getClient(): Redis {
    if (!this.client) {
      const url = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(url, { maxRetriesPerRequest: 1 });
      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });
    }
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
