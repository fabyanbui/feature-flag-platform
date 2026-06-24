import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class AssignFlagGroupDto {
  @ApiProperty({
    example: 'checkout',
  })
  @IsString()
  @Matches(KEY_REGEX, {
    message: `groupKey ${KEY_VALIDATION_MESSAGE}`,
  })
  groupKey!: string;
}
