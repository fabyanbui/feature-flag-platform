import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class CreateFlagGroupDto {
  @ApiProperty({
    example: 'checkout',
    description: 'Immutable group key, unique within the project.',
  })
  @IsString()
  @Matches(KEY_REGEX, {
    message: `key ${KEY_VALIDATION_MESSAGE}`,
  })
  key!: string;

  @ApiProperty({
    example: 'Checkout flags',
  })
  @IsString()
  @MaxLength(120)
  name!: string;
}
