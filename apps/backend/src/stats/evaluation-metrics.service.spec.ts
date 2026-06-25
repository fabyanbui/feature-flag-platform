import { Logger } from '@nestjs/common';
import { EvaluationReason } from '../evaluation/engine/evaluation.types';
import {
  EvaluationMetricsService,
  startOfUtcHour,
} from './evaluation-metrics.service';

describe('EvaluationMetricsService', () => {
  const repository = {
    increment: jest.fn(),
  };

  let service: EvaluationMetricsService;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-25T08:42:19.123Z'));

    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    repository.increment.mockResolvedValue({
      id: 'metric-1',
      count: 1,
    });

    service = new EvaluationMetricsService(repository as never);
  });

  afterEach(() => {
    loggerWarnSpy.mockRestore();
    jest.useRealTimers();
  });

  it('rounds an instant down to the UTC hour', () => {
    expect(startOfUtcHour(new Date('2026-06-25T08:42:19.123Z'))).toEqual(
      new Date('2026-06-25T08:00:00.000Z'),
    );
  });

  it('handles a UTC day boundary deterministically', () => {
    expect(startOfUtcHour(new Date('2026-06-25T23:59:59.999Z'))).toEqual(
      new Date('2026-06-25T23:00:00.000Z'),
    );
  });

  it('records one aggregate metric in the current UTC bucket', async () => {
    service.record({
      projectId: 'project-1',
      environmentId: 'environment-1',
      flagId: 'flag-1',
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      reason: EvaluationReason.GLOBAL_ON,
      enabled: true,
    });

    await flushPromises();

    expect(repository.increment).toHaveBeenCalledTimes(1);
    expect(repository.increment).toHaveBeenCalledWith({
      projectId: 'project-1',
      environmentId: 'environment-1',
      flagId: 'flag-1',
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      bucketStart: new Date('2026-06-25T08:00:00.000Z'),
      reason: EvaluationReason.GLOBAL_ON,
      enabled: true,
    });
  });

  it('defaults unresolved database IDs to null', async () => {
    service.record({
      projectKey: 'missing-project',
      environmentKey: '__unresolved__',
      flagKey: 'missing-flag',
      reason: EvaluationReason.NOT_FOUND,
      enabled: false,
    });

    await flushPromises();

    expect(repository.increment).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: null,
        environmentId: null,
        flagId: null,
        environmentKey: '__unresolved__',
      }),
    );
  });

  it('does not expose metric persistence failure to the caller', async () => {
    repository.increment.mockRejectedValue(
      new Error('metrics database unavailable'),
    );

    expect(() => {
      service.record({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
        reason: EvaluationReason.DEFAULT_OFF,
        enabled: false,
      });
    }).not.toThrow();

    await flushPromises();

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Evaluation metric write failed'),
      expect.any(String),
    );
  });

  it('does not pass evaluation context to the repository', async () => {
    service.record({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      reason: EvaluationReason.ROLE_MATCH,
      enabled: true,
    });

    await flushPromises();

    const payload = repository.increment.mock.calls[0][0];
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain('targetingKey');
    expect(serialized).not.toContain('userId');
    expect(serialized).not.toContain('roles');
    expect(serialized).not.toContain('attributes');
    expect(serialized).not.toContain('context');
    expect(serialized).not.toContain('matchedRuleId');
  });
});

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}
