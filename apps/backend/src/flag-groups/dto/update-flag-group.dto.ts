import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateFlagGroupDto {
  @ApiProperty({
    example: 'Checkout experience',
    description: 'Human-readable name. The group key remains immutable.',
  })
  @IsString()
  @MaxLength(120)
  name!: string;
}
