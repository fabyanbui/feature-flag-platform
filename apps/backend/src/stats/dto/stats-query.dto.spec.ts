import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FlagStatsQueryDto } from './flag-stats-query.dto';
import { ProjectFlagStatsQueryDto } from './project-flag-stats-query.dto';

describe('statistics query DTOs', () => {
  it('uses project statistics pagination and sorting defaults', async () => {
    const dto = plainToInstance(ProjectFlagStatsQueryDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);

    expect(dto.limit).toBe(20);
    expect(dto.offset).toBe(0);
    expect(dto.order).toBe('desc');
    expect(dto.sort).toBe('totalEvaluations');
  });

  it('transforms project statistics pagination values', async () => {
    const dto = plainToInstance(ProjectFlagStatsQueryDto, {
      environmentKey: 'production',
      limit: '50',
      offset: '10',
      sort: 'flagKey',
      order: 'asc',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);

    expect(dto.limit).toBe(50);
    expect(dto.offset).toBe(10);
  });

  it('rejects an invalid environment key', async () => {
    const dto = plainToInstance(FlagStatsQueryDto, {
      environmentKey: 'Production_Environment',
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'environmentKey',
        }),
      ]),
    );
  });

  it('rejects an unsupported project statistics sort field', async () => {
    const dto = plainToInstance(ProjectFlagStatsQueryDto, {
      sort: 'createdAt',
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'sort',
        }),
      ]),
    );
  });

  it('accepts valid ISO timestamps', async () => {
    const dto = plainToInstance(FlagStatsQueryDto, {
      from: '2026-06-24T08:00:00.000Z',
      to: '2026-06-25T08:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid timestamps', async () => {
    const dto = plainToInstance(FlagStatsQueryDto, {
      from: 'yesterday',
      to: 'tomorrow',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property).sort()).toEqual([
      'from',
      'to',
    ]);
  });
});
