import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';

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
    nullable: true,
  })
  archivedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
