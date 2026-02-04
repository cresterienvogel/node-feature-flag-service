import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  async list(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const take = Math.min(Number(limit) || 50, 200);
    const skip = Number(offset) || 0;
    return this.auditService.list(take, skip);
  }
}
