import { ApiProperty } from '@nestjs/swagger';
import { RuleType } from '@prisma/client';

export class RuleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: RuleType,
  })
  type!: RuleType;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  parameters!: unknown;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
