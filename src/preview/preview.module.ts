import { Module } from '@nestjs/common';
import { EvaluateModule } from '../evaluate/evaluate.module';
import { PreviewController } from './preview.controller';

@Module({
  imports: [EvaluateModule],
  controllers: [PreviewController],
})
export class PreviewModule {}
