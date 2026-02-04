import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateRuleDto {
  @IsInt()
  @IsOptional()
  priority?: number;

  @IsString()
  @IsIn(['global', 'percentage', 'segment', 'variant'])
  @IsOptional()
  ruleType?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercent?: number;

  @IsArray()
  @IsOptional()
  variants?: Array<Record<string, any>>;

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @IsObject()
  @IsOptional()
  schedule?: Record<string, any>;
}
