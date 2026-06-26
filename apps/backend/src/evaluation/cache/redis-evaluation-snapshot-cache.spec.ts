import { ConfigService } from '@nestjs/config';
import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';
import { createClient } from 'redis';
import type { EvaluationSnapshot } from '../engine/evaluation.types';
import { DEFAULT_ENVIRONMENT_CACHE_SCOPE } from './evaluation-snapshot-cache';
import { RedisEvaluationSnapshotCache } from './redis-evaluation-snapshot-cache';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

function createSnapshot(): EvaluationSnapshot {
  return {
    flag: {
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    },
    group: null,
    config: {
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.GLOBAL_ON,
      killSwitch: false,
    },
    rules: [],
  };
}

async function* scanBatches(batches: string[][]): AsyncGenerator<string[]> {
  for (const batch of batches) {
    yield batch;
  }
}

describe('RedisEvaluationSnapshotCache', () => {
  const mockedCreateClient = jest.mocked(createClient);
  const configService = {
    get: jest.fn(),
  };
  let client: {
    isOpen: boolean;
    connect: jest.Mock;
    quit: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    scanIterator: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => {
      if (key === 'REDIS_URL') {
        return 'redis://cache.example:6379';
      }

      if (key === 'EVALUATION_CACHE_TTL_MS') {
        return '15000';
      }

      return undefined;
    });

    client = {
      isOpen: true,
      connect: jest.fn().mockImplementation(async () => {
        client.isOpen = true;
        return client;
      }),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      scanIterator: jest.fn(() => scanBatches([])),
      on: jest.fn().mockReturnThis(),
    };
    mockedCreateClient.mockReturnValue(client as never);
  });

  function createCache(): RedisEvaluationSnapshotCache {
    return new RedisEvaluationSnapshotCache(
      configService as unknown as ConfigService,
    );
  }

  it('creates a Redis client with safe outage settings without logging secrets', async () => {
    const cache = createCache();

    await cache.get({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    });

    expect(mockedCreateClient).toHaveBeenCalledWith({
      url: 'redis://cache.example:6379',
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 500,
        reconnectStrategy: false,
      },
    });
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('connects lazily when the first cache operation runs', async () => {
    client.isOpen = false;
    const cache = createCache();

    await cache.get({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    });

    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it('returns null for a Redis cache miss', async () => {
    const cache = createCache();

    await expect(
      cache.get({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();
  });

  it('returns a parsed snapshot for a Redis cache hit', async () => {
    const snapshot = createSnapshot();
    client.get.mockResolvedValue(JSON.stringify(snapshot));
    const cache = createCache();

    await expect(
      cache.get({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      }),
    ).resolves.toEqual(snapshot);
  });

  it('deletes invalid JSON and treats it as a miss', async () => {
    client.get.mockResolvedValue('{not-json');
    const cache = createCache();

    await expect(
      cache.get({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();

    expect(client.del).toHaveBeenCalledWith(
      'evaluation-snapshot:demo-project:production:new-checkout',
    );
  });

  it('stores snapshots with the configured TTL', async () => {
    const snapshot = createSnapshot();
    const cache = createCache();

    await cache.set(
      {
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      },
      snapshot,
    );

    expect(client.set).toHaveBeenCalledWith(
      'evaluation-snapshot:demo-project:production:new-checkout',
      JSON.stringify(snapshot),
      { PX: 15000 },
    );
  });

  it('uses the same default TTL fallback as the in-memory provider', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'EVALUATION_CACHE_TTL_MS') {
        return 'invalid';
      }

      return undefined;
    });
    const snapshot = createSnapshot();
    const cache = createCache();

    await cache.set(
      {
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      },
      snapshot,
    );

    expect(client.set).toHaveBeenCalledWith(
      `evaluation-snapshot:demo-project:${DEFAULT_ENVIRONMENT_CACHE_SCOPE}:new-checkout`,
      JSON.stringify(snapshot),
      { PX: 30000 },
    );
  });

  it('invalidates the selected environment and default alias', async () => {
    const cache = createCache();

    await cache.invalidateFlag({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    });

    expect(client.del).toHaveBeenCalledWith([
      'evaluation-snapshot:demo-project:production:new-checkout',
      `evaluation-snapshot:demo-project:${DEFAULT_ENVIRONMENT_CACHE_SCOPE}:new-checkout`,
    ]);
  });

  it('invalidates every environment when environment is omitted', async () => {
    client.scanIterator.mockImplementation(() =>
      scanBatches([
        [
          'evaluation-snapshot:demo-project:production:new-checkout',
          'evaluation-snapshot:demo-project:staging:new-checkout',
        ],
      ]),
    );
    const cache = createCache();

    await cache.invalidateFlag({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    });

    expect(client.scanIterator).toHaveBeenCalledWith({
      MATCH: 'evaluation-snapshot:demo-project:*:new-checkout',
      COUNT: 100,
    });
    expect(client.del).toHaveBeenCalledWith([
      'evaluation-snapshot:demo-project:production:new-checkout',
      'evaluation-snapshot:demo-project:staging:new-checkout',
    ]);
  });

  it('invalidates multiple unique flags', async () => {
    client.scanIterator
      .mockImplementationOnce(() =>
        scanBatches([['evaluation-snapshot:demo-project:production:first']]),
      )
      .mockImplementationOnce(() =>
        scanBatches([['evaluation-snapshot:demo-project:production:second']]),
      );
    const cache = createCache();

    await cache.invalidateFlags({
      projectKey: 'demo-project',
      flagKeys: ['first', 'second', 'first'],
    });

    expect(client.scanIterator).toHaveBeenCalledTimes(2);
    expect(client.del).toHaveBeenCalledWith([
      'evaluation-snapshot:demo-project:production:first',
    ]);
    expect(client.del).toHaveBeenCalledWith([
      'evaluation-snapshot:demo-project:production:second',
    ]);
  });

  it('clears only evaluation-snapshot keys owned by this cache', async () => {
    client.scanIterator.mockImplementation(() =>
      scanBatches([['evaluation-snapshot:demo-project:production:first']]),
    );
    const cache = createCache();

    await cache.clear();

    expect(client.scanIterator).toHaveBeenCalledWith({
      MATCH: 'evaluation-snapshot:*:*:*',
      COUNT: 100,
    });
    expect(client.del).toHaveBeenCalledWith([
      'evaluation-snapshot:demo-project:production:first',
    ]);
  });

  it('rejects Redis failures so the evaluation service can use repository fallback', async () => {
    client.get.mockRejectedValue(new Error('redis unavailable'));
    const cache = createCache();

    await expect(
      cache.get({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).rejects.toThrow('redis unavailable');
  });

  it('closes an open Redis connection on module shutdown', async () => {
    const cache = createCache();

    await cache.get({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    });
    await cache.onModuleDestroy();

    expect(client.quit).toHaveBeenCalledTimes(1);
  });
});
