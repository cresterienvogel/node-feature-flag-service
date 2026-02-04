import { Body, Controller, Get, NotFoundException, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AuthService } from './auth.service';

@ApiTags('api-keys')
@Controller('api-keys')
export class ApiKeysController {
  constructor(
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  @Post()
  async create(@Body() dto: CreateApiKeyDto, @Req() req: Request) {
    const { record, rawKey } = await this.authService.createApiKey(dto.name);
    await this.auditService.logEvent({
      actorApiKeyId: (req as any).apiKeyId ?? null,
      action: 'api_key.create',
      entityType: 'api_key',
      entityId: record.id,
      metadata: { name: record.name, prefix: record.prefix },
    });
    return {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      createdAt: record.createdAt,
      rawKey,
    };
  }

  @Get()
  async list() {
    return this.authService.listApiKeys();
  }

  @Post(':id/rotate')
  async rotate(@Param('id') id: string, @Req() req: Request) {
    const result = await this.authService.rotateApiKey(id);
    if (!result) throw new NotFoundException('API key not found');
    await this.auditService.logEvent({
      actorApiKeyId: (req as any).apiKeyId ?? null,
      action: 'api_key.rotate',
      entityType: 'api_key',
      entityId: id,
      metadata: { newId: result.record.id },
    });
    return {
      id: result.record.id,
      name: result.record.name,
      prefix: result.record.prefix,
      createdAt: result.record.createdAt,
      rawKey: result.rawKey,
    };
  }

  @Post(':id/revoke')
  async revoke(@Param('id') id: string, @Req() req: Request) {
    const record = await this.authService.revokeApiKey(id);
    await this.auditService.logEvent({
      actorApiKeyId: (req as any).apiKeyId ?? null,
      action: 'api_key.revoke',
      entityType: 'api_key',
      entityId: id,
      metadata: { prefix: record.prefix },
    });
    return {
      id: record.id,
      revokedAt: record.revokedAt,
    };
  }
}
