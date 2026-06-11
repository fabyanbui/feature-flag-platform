import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SampleUserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'beta',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'beta-tester',
  })
  @IsOptional()
  @IsString()
  role?: string;
}
