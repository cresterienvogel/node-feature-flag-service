import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logEvent(data: {
    actorApiKeyId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.auditEvent.create({
      data: {
        actorApiKeyId: data.actorApiKeyId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata ?? undefined,
      },
    });
  }

  async list(limit = 50, offset = 0) {
    const events = await this.prisma.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return events.map((event) => ({
      ...event,
      id: event.id.toString(),
    }));
  }
}
