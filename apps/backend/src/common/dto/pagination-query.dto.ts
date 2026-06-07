import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 20;

    @IsOptional()
    @IsInt()
    @Min(0)
    offset = 0;

    @IsOptional()
    sort?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    order: 'asc' | 'desc' = 'desc';
}