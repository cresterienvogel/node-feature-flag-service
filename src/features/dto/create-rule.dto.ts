import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRuleDto {
  @IsInt()
  priority!: number;

  @IsString()
  @IsIn(['global', 'percentage', 'segment', 'variant'])
  @IsNotEmpty()
  ruleType!: string;

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
