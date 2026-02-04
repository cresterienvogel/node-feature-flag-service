import { IsArray, IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SubjectDto } from '../../evaluate/dto/evaluate.dto';

export class PreviewDto {
  @IsString()
  @IsNotEmpty()
  featureKey!: string;

  @IsString()
  @IsIn(['dev', 'staging', 'prod'])
  environment!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectDto)
  subjects!: SubjectDto[];
}
