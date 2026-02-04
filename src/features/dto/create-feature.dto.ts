import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['dev', 'staging', 'prod'])
  environment!: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
