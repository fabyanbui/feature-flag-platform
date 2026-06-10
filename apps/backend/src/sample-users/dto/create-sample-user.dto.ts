import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateSampleUserDto {
  @ApiProperty({
    example: 'Beta User',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'displayName must not be empty or whitespace only.',
  })
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({
    example: 'demo-user-beta',
    description:
      'Stable non-PII key used for percentage rollout. Do not use emails, phone numbers, real names, or other personally identifiable information.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'targetingKey must not be empty or whitespace only.',
  })
  @MaxLength(120)
  targetingKey!: string;

  @ApiPropertyOptional({
    example: 'demo-user-beta',
    description:
      'Optional demo identifier used by allowlist rules. Prefer synthetic non-PII values, not emails or real user IDs.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  userId?: string;

  @ApiPropertyOptional({
    example: ['beta-tester'],
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
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
