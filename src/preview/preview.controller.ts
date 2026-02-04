import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EvaluateService } from '../evaluate/evaluate.service';
import { PreviewDto } from './dto/preview.dto';

@ApiTags('preview')
@Controller('preview')
export class PreviewController {
  constructor(private evaluateService: EvaluateService) {}

  @Post()
  async preview(@Body() dto: PreviewDto) {
    const results = [];
    for (const subject of dto.subjects) {
      const { result } = await this.evaluateService.evaluate(dto.featureKey, dto.environment, {
        key: subject.key,
        userId: subject.userId,
        tenantId: subject.tenantId,
        attributes: subject.attributes,
      });
      results.push({ subjectKey: subject.key, result });
    }
    return { featureKey: dto.featureKey, environment: dto.environment, results };
  }
}
