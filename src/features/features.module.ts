import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';

@Module({
  imports: [AuditModule],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
