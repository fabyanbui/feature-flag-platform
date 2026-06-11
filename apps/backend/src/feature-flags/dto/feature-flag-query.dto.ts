import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureFlagLifecycleStatus, FlagConfigStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FeatureFlagQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'checkout',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: FlagConfigStatus,
  })
  @IsOptional()
  @IsEnum(FlagConfigStatus)
  status?: FlagConfigStatus;

  @ApiPropertyOptional({
    enum: FeatureFlagLifecycleStatus,
  })
  @IsOptional()
  @IsEnum(FeatureFlagLifecycleStatus)
  lifecycleStatus?: FeatureFlagLifecycleStatus;
}
