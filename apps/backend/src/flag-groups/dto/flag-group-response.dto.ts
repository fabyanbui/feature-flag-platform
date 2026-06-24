import { ApiProperty } from '@nestjs/swagger';

export class FlagGroupResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'demo-project',
  })
  projectKey!: string;

  @ApiProperty({
    example: 'checkout',
  })
  key!: string;

  @ApiProperty({
    example: 'Checkout flags',
  })
  name!: string;

  @ApiProperty({
    example: 'production',
  })
  environmentKey!: string;

  @ApiProperty({
    example: false,
  })
  killSwitch!: boolean;

  @ApiProperty({
    example: 2,
    minimum: 0,
  })
  assignedFlagCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
