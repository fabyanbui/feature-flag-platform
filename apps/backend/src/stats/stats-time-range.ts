import { validationError } from '../common/errors/api-exception.helpers';

export const DEFAULT_STATS_RANGE_HOURS = 24;
export const MAX_STATS_RANGE_DAYS = 30;

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS;

export interface StatsTimeRangeInput {
  from?: string;
  to?: string;
}

export interface NormalizedStatsTimeRange {
  from: Date;
  to: Date;
}

export function normalizeStatsTimeRange(
  input: StatsTimeRangeInput,
  now = new Date(),
): NormalizedStatsTimeRange {
  const requestedTo = input.to ? new Date(input.to) : now;
  const requestedFrom = input.from
    ? new Date(input.from)
    : new Date(
        requestedTo.getTime() -
          DEFAULT_STATS_RANGE_HOURS * HOUR_IN_MILLISECONDS,
      );

  if (requestedFrom > requestedTo) {
    throw validationError('Invalid statistics time range.', [
      {
        field: 'from',
        message: 'from must be earlier than or equal to to.',
      },
    ]);
  }

  const from = floorToUtcHour(requestedFrom);
  const to = ceilToUtcHour(requestedTo);
  const maximumRangeMs = MAX_STATS_RANGE_DAYS * DAY_IN_MILLISECONDS;

  if (to.getTime() - from.getTime() > maximumRangeMs) {
    throw validationError('Statistics time range is too large.', [
      {
        field: 'from',
        message: `Statistics queries may cover at most ${MAX_STATS_RANGE_DAYS} days.`,
      },
    ]);
  }

  return { from, to };
}

export function floorToUtcHour(date: Date): Date {
  const result = new Date(date);

  result.setUTCMinutes(0, 0, 0);

  return result;
}

export function ceilToUtcHour(date: Date): Date {
  const result = floorToUtcHour(date);

  if (result.getTime() === date.getTime()) {
    return result;
  }

  result.setUTCHours(result.getUTCHours() + 1);

  return result;
}
