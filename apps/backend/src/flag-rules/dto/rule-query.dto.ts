import { ApiPropertyOptional } from '@nestjs/swagger';
import { RuleType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class RuleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: RuleType,
  })
  @IsOptional()
  @IsEnum(RuleType)
  type?: RuleType;
}
