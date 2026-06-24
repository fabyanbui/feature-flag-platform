import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FlagGroupQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'checkout',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'production',
    description:
      'Environment used to select the returned group kill-switch state. Defaults to the project default environment.',
  })
  @IsOptional()
  @IsString()
  @Matches(KEY_REGEX, {
    message: `environmentKey ${KEY_VALIDATION_MESSAGE}`,
  })
  environmentKey?: string;
}
