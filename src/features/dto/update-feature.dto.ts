import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateFeatureDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
