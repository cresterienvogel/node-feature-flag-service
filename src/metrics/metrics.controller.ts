import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @Public()
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return this.metricsService.metrics();
  }
}
