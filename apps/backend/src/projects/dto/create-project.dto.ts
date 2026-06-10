import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class CreateProjectDto {
  @ApiProperty({
    example: 'demo-project',
    description: 'Globally unique immutable project key.',
  })
  @IsString()
  @Matches(KEY_REGEX, {
    message: `key ${KEY_VALIDATION_MESSAGE}`,
  })
  key!: string;

  @ApiProperty({
    example: 'Demo Project',
  })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Project used for feature flag demos.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
