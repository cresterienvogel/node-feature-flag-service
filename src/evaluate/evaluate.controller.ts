import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EvaluateDto } from './dto/evaluate.dto';
import { EvaluateService } from './evaluate.service';

@ApiTags('evaluate')
@Controller('evaluate')
export class EvaluateController {
  constructor(private evaluateService: EvaluateService) {}

  @Post()
  async evaluate(@Body() dto: EvaluateDto) {
    const { result } = await this.evaluateService.evaluate(dto.featureKey, dto.environment, {
      key: dto.subject.key,
      userId: dto.subject.userId,
      tenantId: dto.subject.tenantId,
      attributes: dto.subject.attributes,
    });
    return result;
  }
}
