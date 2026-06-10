import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  KEY_REGEX,
  KEY_VALIDATION_MESSAGE,
} from '../../common/constants/api.constants';

export class EvaluationContextDto {
  @ApiPropertyOptional({
    example: 'demo-user-regular',
    description:
      'Stable non-PII key used for deterministic percentage rollout.',
  })
  @IsOptional()
  @IsString()
  targetingKey?: string;

  @ApiPropertyOptional({
    example: 'demo-user-regular',
    description: 'Stable demo identifier used by user allowlist rules.',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: ['beta-tester'],
    description: 'Role keys used by role-targeting rules.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({
    example: {
      plan: 'pro',
      country: 'VN',
    },
    description: 'Additional non-PII attributes reserved for future rules.',
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class EvaluateRequestDto {
  @ApiProperty({
    example: 'demo-project',
    description: 'Stable project key.',
  })
  @IsString()
  @Matches(KEY_REGEX, {
    message: `projectKey ${KEY_VALIDATION_MESSAGE}`,
  })
  projectKey!: string;

  @ApiPropertyOptional({
    example: 'production',
    description:
      'Optional environment key. If omitted, the default project environment is used.',
  })
  @IsOptional()
  @IsString()
  @Matches(KEY_REGEX, {
    message: `environmentKey ${KEY_VALIDATION_MESSAGE}`,
  })
  environmentKey?: string;

  @ApiProperty({
    example: 'new-checkout',
    description: 'Stable feature flag key within the project.',
  })
  @IsString()
  @Matches(KEY_REGEX, {
    message: `flagKey ${KEY_VALIDATION_MESSAGE}`,
  })
  flagKey!: string;

  @ApiProperty({
    type: EvaluationContextDto,
    description: 'Runtime evaluation context.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => EvaluationContextDto)
  context!: EvaluationContextDto;
}
