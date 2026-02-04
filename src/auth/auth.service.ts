import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
};

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  generateKey(): { raw: string; prefix: string; hash: string } {
    const raw = `ff_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = raw.slice(0, 12);
    const hash = this.hashKey(raw);
    return { raw, prefix, hash };
  }

  async validateApiKey(raw: string) {
    const keyHash = this.hashKey(raw);
    const record = await this.prisma.apiKey.findFirst({
      where: { keyHash, revokedAt: null },
    });
    if (!record) return null;
    await this.prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });
    return record;
  }

  async createApiKey(name: string) {
    const generated = this.generateKey();
    const record = await this.prisma.apiKey.create({
      data: {
        name,
        prefix: generated.prefix,
        keyHash: generated.hash,
      },
    });
    return { record, rawKey: generated.raw };
  }

  async listApiKeys(): Promise<ApiKeyRecord[]> {
    return this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        revokedAt: true,
        lastUsedAt: true,
      },
    });
  }

  async revokeApiKey(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async rotateApiKey(id: string) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!existing) return null;

    await this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    const created = await this.createApiKey(existing.name);
    return created;
  }
}
