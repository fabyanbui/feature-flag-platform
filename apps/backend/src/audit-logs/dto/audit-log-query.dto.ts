import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditTargetType } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AuditLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: AuditTargetType,
  })
  @IsOptional()
  @IsEnum(AuditTargetType)
  targetType?: AuditTargetType;

  @ApiPropertyOptional({
    example: 'new-checkout',
  })
  @IsOptional()
  @IsString()
  targetKey?: string;

  @ApiPropertyOptional({
    example: 'admin@example.local',
  })
  @IsOptional()
  @IsString()
  actor?: string;

  @ApiPropertyOptional({
    enum: AuditAction,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-06-10T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
