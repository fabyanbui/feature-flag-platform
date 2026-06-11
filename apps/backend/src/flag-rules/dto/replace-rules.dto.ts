import { ApiProperty } from '@nestjs/swagger';
import { RuleType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';

export class RuleInputDto {
  @ApiProperty({
    enum: RuleType,
    example: RuleType.ROLE_TARGETING,
  })
  @IsEnum(RuleType)
  type!: RuleType;

  @ApiProperty({
    example: 10,
  })
  @IsInt()
  @Min(0)
  priority!: number;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({
    example: {
      roles: ['beta-tester'],
    },
  })
  @IsObject()
  parameters!: Record<string, unknown>;
}

export class ReplaceRulesDto {
  @ApiProperty({
    type: [RuleInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleInputDto)
  rules!: RuleInputDto[];
}
