import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';

export class FeatureFlagGroupSummaryDto {
  @ApiProperty({
    example: 'checkout',
  })
  key!: string;

  @ApiProperty({
    example: 'Checkout flags',
  })
  name!: string;

  @ApiProperty({
    example: false,
  })
  killSwitch!: boolean;
}

export class FeatureFlagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'demo-project',
  })
  projectKey!: string;

  @ApiProperty({
    example: 'new-checkout',
  })
  key!: string;

  @ApiProperty({
    example: 'New Checkout',
  })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    enum: FeatureFlagLifecycleStatus,
  })
  lifecycleStatus!: FeatureFlagLifecycleStatus;

  @ApiProperty({
    enum: FlagConfigStatus,
    description:
      'Default environment config status. Not the runtime On/Off result.',
  })
  status!: FlagConfigStatus;

  @ApiProperty({
    enum: ServingMode,
  })
  servingMode!: ServingMode;

  @ApiProperty()
  killSwitch!: boolean;

  @ApiProperty({
    example: 'production',
  })
  environmentKey!: string;

  @ApiPropertyOptional({
    type: FeatureFlagGroupSummaryDto,
    nullable: true,
  })
  group!: FeatureFlagGroupSummaryDto | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  archivedAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Soft-delete timestamp. Deleted flags are hidden from the normal flag list.',
  })
  deletedAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  deletedBy!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
