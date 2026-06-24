import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditTargetType } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'demo-project',
  })
  projectKey!: string;

  @ApiPropertyOptional({
    example: 'production',
    nullable: true,
  })
  environmentKey!: string | null;

  @ApiProperty({
    enum: AuditTargetType,
  })
  targetType!: AuditTargetType;

  @ApiProperty()
  targetId!: string;

  @ApiPropertyOptional({
    example: 'new-checkout',
    nullable: true,
  })
  targetKey!: string | null;

  @ApiProperty({
    enum: AuditAction,
  })
  action!: AuditAction;

  @ApiProperty({
    example: 'admin@example.local',
  })
  actor!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  before!: unknown;

  @ApiPropertyOptional({
    nullable: true,
  })
  after!: unknown;

  @ApiPropertyOptional({
    nullable: true,
  })
  metadata!: unknown;

  @ApiProperty()
  requestId!: string;

  @ApiProperty()
  createdAt!: Date;
}
