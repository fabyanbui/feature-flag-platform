import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SampleUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'demo-project',
  })
  projectKey!: string;

  @ApiProperty({
    example: 'Beta User',
  })
  displayName!: string;

  @ApiProperty({
    example: 'demo-user-beta',
  })
  targetingKey!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'demo-user-beta',
  })
  userId!: string | null;

  @ApiProperty({
    type: [String],
    example: ['beta-tester'],
  })
  roles!: string[];

  @ApiProperty({
    example: {
      plan: 'pro',
    },
  })
  attributes!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
