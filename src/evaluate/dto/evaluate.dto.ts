import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, string | number | boolean>;
}

export class EvaluateDto {
  @IsString()
  @IsNotEmpty()
  featureKey!: string;

  @IsString()
  @IsIn(['dev', 'staging', 'prod'])
  environment!: string;

  @ValidateNested()
  @Type(() => SubjectDto)
  subject!: SubjectDto;
}
