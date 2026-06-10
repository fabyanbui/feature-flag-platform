import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSampleUserDto {
  @ApiProperty({
    example: 'Beta User',
  })
  @IsString()
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({
    example: 'demo-user-beta',
    description: 'Stable non-PII key used for percentage rollout.',
  })
  @IsString()
  @MaxLength(120)
  targetingKey!: string;

  @ApiPropertyOptional({
    example: 'demo-user-beta',
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
