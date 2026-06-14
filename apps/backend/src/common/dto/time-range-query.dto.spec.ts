import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TimeRangeQueryDto } from './time-range-query.dto';

describe('TimeRangeQueryDto', () => {
    it('accepts empty query', async () => {
        const dto = plainToInstance(TimeRangeQueryDto, {});

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it('accepts valid from and to ISO timestamps', async () => {
        const dto = plainToInstance(TimeRangeQueryDto, {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-02T00:00:00.000Z',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it('rejects invalid from timestamp', async () => {
        const dto = plainToInstance(TimeRangeQueryDto, {
            from: 'not-a-date',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('from');
    });

    it('rejects invalid to timestamp', async () => {
        const dto = plainToInstance(TimeRangeQueryDto, {
            to: 'not-a-date',
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('to');
    });
});