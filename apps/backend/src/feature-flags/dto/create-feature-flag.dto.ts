import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class CreateFeatureFlagDto {
  @ApiProperty({
    example: 'new-checkout',
  })
  @IsString()
  @Matches(KEY_REGEX, {
    message: `key ${KEY_VALIDATION_MESSAGE}`,
  })
  key!: string;

  @ApiProperty({
    example: 'New Checkout',
  })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Controls rollout of the new checkout experience.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
