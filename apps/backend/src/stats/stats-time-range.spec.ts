import { BadRequestException } from '@nestjs/common';
import {
  ceilToUtcHour,
  floorToUtcHour,
  normalizeStatsTimeRange,
} from './stats-time-range';

describe('statistics time range', () => {
  const now = new Date('2026-06-25T10:35:00.000Z');

  it('rounds from down and to up to UTC hours', () => {
    expect(
      normalizeStatsTimeRange(
        {
          from: '2026-06-25T08:20:00.000Z',
          to: '2026-06-25T10:15:00.000Z',
        },
        now,
      ),
    ).toEqual({
      from: new Date('2026-06-25T08:00:00.000Z'),
      to: new Date('2026-06-25T11:00:00.000Z'),
    });
  });

  it('does not advance an already exact to boundary', () => {
    expect(ceilToUtcHour(new Date('2026-06-25T10:00:00.000Z'))).toEqual(
      new Date('2026-06-25T10:00:00.000Z'),
    );
  });

  it('uses the previous 24 hours by default', () => {
    expect(normalizeStatsTimeRange({}, now)).toEqual({
      from: new Date('2026-06-24T10:00:00.000Z'),
      to: new Date('2026-06-25T11:00:00.000Z'),
    });
  });

  it('rejects from after to', () => {
    expect(() =>
      normalizeStatsTimeRange(
        {
          from: '2026-06-25T11:00:00.000Z',
          to: '2026-06-25T10:00:00.000Z',
        },
        now,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects an effective range over 30 days', () => {
    expect(() =>
      normalizeStatsTimeRange(
        {
          from: '2026-05-01T00:00:00.000Z',
          to: '2026-06-25T00:00:00.000Z',
        },
        now,
      ),
    ).toThrow(BadRequestException);
  });

  it('does not mutate supplied dates', () => {
    const input = new Date('2026-06-25T08:42:00.000Z');

    floorToUtcHour(input);

    expect(input).toEqual(new Date('2026-06-25T08:42:00.000Z'));
  });
});
