import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, Matches } from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class FlagStatsQueryDto {
  @ApiPropertyOptional({
    example: 'production',
    description:
      'Environment used for statistics. Defaults to the project default environment.',
  })
  @IsOptional()
  @IsString()
  @Matches(KEY_REGEX, {
    message: `environmentKey ${KEY_VALIDATION_MESSAGE}`,
  })
  environmentKey?: string;

  @ApiPropertyOptional({
    example: '2026-06-24T08:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-06-25T08:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
