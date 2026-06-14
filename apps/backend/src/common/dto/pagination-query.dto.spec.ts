import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
    it('uses default limit, offset, and order', async () => {
        const dto = plainToInstance(PaginationQueryDto, {});

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.limit).toBe(20);
        expect(dto.offset).toBe(0);
        expect(dto.order).toBe('desc');
    });

    it('transforms limit and offset to numbers', async () => {
        const dto = plainToInstance(PaginationQueryDto, {
            limit: '50',
            offset: '10',
            order: 'asc',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.limit).toBe(50);
        expect(dto.offset).toBe(10);
        expect(dto.order).toBe('asc');
    });

    it('rejects limit below 1', async () => {
        const dto = plainToInstance(PaginationQueryDto, {
            limit: '0',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('limit');
    });

    it('rejects limit above 100', async () => {
        const dto = plainToInstance(PaginationQueryDto, {
            limit: '101',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('limit');
    });

    it('rejects negative offset', async () => {
        const dto = plainToInstance(PaginationQueryDto, {
            offset: '-1',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('offset');
    });

    it('rejects invalid order', async () => {
        const dto = plainToInstance(PaginationQueryDto, {
            order: 'newest',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('order');
    });
});