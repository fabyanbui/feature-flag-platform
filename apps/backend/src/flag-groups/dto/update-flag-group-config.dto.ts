import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Matches } from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class UpdateFlagGroupConfigDto {
  @ApiProperty({
    example: 'production',
  })
  @IsString()
  @Matches(KEY_REGEX, {
    message: `environmentKey ${KEY_VALIDATION_MESSAGE}`,
  })
  environmentKey!: string;

  @ApiProperty({
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  killSwitch!: boolean | string;
}
