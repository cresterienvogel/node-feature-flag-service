import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { EvaluateController } from './evaluate.controller';
import { EvaluateService } from './evaluate.service';

@Module({
  imports: [MetricsModule],
  controllers: [EvaluateController],
  providers: [EvaluateService],
  exports: [EvaluateService],
})
export class EvaluateModule {}
