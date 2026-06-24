import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FlagHistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['createdAt'],
    default: 'createdAt',
    description: 'Field used to order flag history entries.',
  })
  @IsOptional()
  @IsIn(['createdAt'])
  override sort = 'createdAt';
}
