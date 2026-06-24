import { Logger } from '@nestjs/common';
import { EvaluationCacheInvalidator } from './evaluation-cache-invalidator';

describe('EvaluationCacheInvalidator', () => {
  const snapshotCache = {
    get: jest.fn(),
    set: jest.fn(),
    invalidateFlag: jest.fn(),
    invalidateFlags: jest.fn(),
    clear: jest.fn(),
  };

  let invalidator: EvaluationCacheInvalidator;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    snapshotCache.invalidateFlag.mockResolvedValue(undefined);
    snapshotCache.invalidateFlags.mockResolvedValue(undefined);

    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    debugSpy = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);

    invalidator = new EvaluationCacheInvalidator(snapshotCache);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('invalidates one flag across every environment', async () => {
    await invalidator.invalidateFlag('demo-project', 'new-checkout');

    expect(snapshotCache.invalidateFlag).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      environmentKey: undefined,
    });
  });

  it('invalidates one flag in an environment', async () => {
    await invalidator.invalidateFlag(
      'demo-project',
      'new-checkout',
      'production',
    );

    expect(snapshotCache.invalidateFlag).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      environmentKey: 'production',
    });
  });

  it('invalidates multiple unique flags', async () => {
    await invalidator.invalidateFlags(
      'demo-project',
      ['new-checkout', 'recommendations', 'new-checkout'],
      'production',
    );

    expect(snapshotCache.invalidateFlags).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKeys: ['new-checkout', 'recommendations'],
    });
  });

  it('does nothing for an empty flag list', async () => {
    await invalidator.invalidateFlags('demo-project', [], 'production');

    expect(snapshotCache.invalidateFlags).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('does not throw when single-flag invalidation fails', async () => {
    snapshotCache.invalidateFlag.mockRejectedValue(
      new Error('cache unavailable'),
    );

    await expect(
      invalidator.invalidateFlag('demo-project', 'new-checkout'),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('committed mutation remains successful'),
      expect.any(String),
    );
  });

  it('does not throw when multi-flag invalidation fails', async () => {
    snapshotCache.invalidateFlags.mockRejectedValue(
      new Error('cache unavailable'),
    );

    await expect(
      invalidator.invalidateFlags(
        'demo-project',
        ['new-checkout', 'recommendations'],
        'production',
      ),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('committed mutation remains successful'),
      expect.any(String),
    );
  });
});
