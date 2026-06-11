import { ApiPropertyOptional } from '@nestjs/swagger';
import { FlagConfigStatus, ServingMode } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({
    example: 'New Checkout',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: FlagConfigStatus,
    example: FlagConfigStatus.ENABLED,
  })
  @IsOptional()
  @IsEnum(FlagConfigStatus)
  status?: FlagConfigStatus;

  @ApiPropertyOptional({
    enum: ServingMode,
    example: ServingMode.TARGETED,
  })
  @IsOptional()
  @IsEnum(ServingMode)
  servingMode?: ServingMode;

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  killSwitch?: boolean;
}
