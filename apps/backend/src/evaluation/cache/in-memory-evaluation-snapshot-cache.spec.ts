import { ConfigService } from '@nestjs/config';
import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';
import type { EvaluationSnapshot } from '../engine/evaluation.types';
import {
  DEFAULT_EVALUATION_CACHE_TTL_MS,
  InMemoryEvaluationSnapshotCache,
} from './in-memory-evaluation-snapshot-cache';

function createSnapshot(): EvaluationSnapshot {
  return {
    flag: {
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    },
    group: null,
    config: {
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.TARGETED,
      killSwitch: false,
    },
    rules: [],
  };
}

describe('InMemoryEvaluationSnapshotCache', () => {
  const configService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createCache(ttl?: string | number): InMemoryEvaluationSnapshotCache {
    configService.get.mockReturnValue(ttl);

    return new InMemoryEvaluationSnapshotCache(
      configService as unknown as ConfigService,
    );
  }

  it('returns null for a cache miss', async () => {
    const cache = createCache();

    await expect(
      cache.get({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();
  });

  it('returns a stored snapshot before expiry', async () => {
    const cache = createCache(30_000);
    const snapshot = createSnapshot();
    const address = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    };

    await cache.set(address, snapshot);

    await expect(cache.get(address)).resolves.toBe(snapshot);
  });

  it('removes and misses an expired snapshot', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const cache = createCache(1_000);
    const snapshot = createSnapshot();
    const address = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    };

    nowSpy.mockReturnValue(10_000);
    await cache.set(address, snapshot);

    nowSpy.mockReturnValue(10_999);
    await expect(cache.get(address)).resolves.toBe(snapshot);

    nowSpy.mockReturnValue(11_000);
    await expect(cache.get(address)).resolves.toBeNull();

    nowSpy.mockReturnValue(10_500);
    await expect(cache.get(address)).resolves.toBeNull();
  });

  it.each([undefined, '', 'invalid', 0, -1])(
    'uses the default TTL for invalid value %p',
    async (configuredTtl) => {
      const nowSpy = jest.spyOn(Date, 'now');
      const cache = createCache(configuredTtl);
      const snapshot = createSnapshot();
      const address = {
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      };

      nowSpy.mockReturnValue(1_000);
      await cache.set(address, snapshot);

      nowSpy.mockReturnValue(1_000 + DEFAULT_EVALUATION_CACHE_TTL_MS - 1);
      await expect(cache.get(address)).resolves.toBe(snapshot);

      nowSpy.mockReturnValue(1_000 + DEFAULT_EVALUATION_CACHE_TTL_MS);
      await expect(cache.get(address)).resolves.toBeNull();
    },
  );

  it('invalidates every environment when environment is omitted', async () => {
    const cache = createCache();
    const snapshot = createSnapshot();
    const production = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    };
    const staging = {
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
    };

    await cache.set(production, snapshot);
    await cache.set(staging, snapshot);

    await cache.invalidateFlag({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    });

    await expect(cache.get(production)).resolves.toBeNull();
    await expect(cache.get(staging)).resolves.toBeNull();
  });

  it('does not invalidate another flag or project', async () => {
    const cache = createCache();
    const snapshot = createSnapshot();
    const target = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };
    const otherFlag = {
      projectKey: 'demo-project',
      flagKey: 'recommendations',
    };
    const otherProject = {
      projectKey: 'other-project',
      flagKey: 'new-checkout',
    };

    await cache.set(target, snapshot);
    await cache.set(otherFlag, snapshot);
    await cache.set(otherProject, snapshot);

    await cache.invalidateFlag(target);

    await expect(cache.get(target)).resolves.toBeNull();
    await expect(cache.get(otherFlag)).resolves.toBe(snapshot);
    await expect(cache.get(otherProject)).resolves.toBe(snapshot);
  });

  it('invalidates the selected environment and default alias', async () => {
    const cache = createCache();
    const snapshot = createSnapshot();
    const defaultAddress = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };
    const productionAddress = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    };
    const stagingAddress = {
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
    };

    await cache.set(defaultAddress, snapshot);
    await cache.set(productionAddress, snapshot);
    await cache.set(stagingAddress, snapshot);

    await cache.invalidateFlag(productionAddress);

    await expect(cache.get(defaultAddress)).resolves.toBeNull();
    await expect(cache.get(productionAddress)).resolves.toBeNull();
    await expect(cache.get(stagingAddress)).resolves.toBe(snapshot);
  });

  it('invalidates multiple listed flags', async () => {
    const cache = createCache();
    const snapshot = createSnapshot();
    const checkout = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };
    const recommendations = {
      projectKey: 'demo-project',
      flagKey: 'recommendations',
    };
    const unrelated = {
      projectKey: 'demo-project',
      flagKey: 'unrelated-feature',
    };

    await cache.set(checkout, snapshot);
    await cache.set(recommendations, snapshot);
    await cache.set(unrelated, snapshot);

    await cache.invalidateFlags({
      projectKey: 'demo-project',
      flagKeys: ['new-checkout', 'recommendations'],
    });

    await expect(cache.get(checkout)).resolves.toBeNull();
    await expect(cache.get(recommendations)).resolves.toBeNull();
    await expect(cache.get(unrelated)).resolves.toBe(snapshot);
  });

  it('invalidates multiple flags only in the selected environment', async () => {
    const cache = createCache();
    const snapshot = createSnapshot();
    const productionCheckout = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    };
    const stagingCheckout = {
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
    };
    const productionRecommendations = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'recommendations',
    };
    const stagingRecommendations = {
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'recommendations',
    };

    await cache.set(productionCheckout, snapshot);
    await cache.set(stagingCheckout, snapshot);
    await cache.set(productionRecommendations, snapshot);
    await cache.set(stagingRecommendations, snapshot);

    await cache.invalidateFlags({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKeys: ['new-checkout', 'recommendations'],
    });

    await expect(cache.get(productionCheckout)).resolves.toBeNull();
    await expect(cache.get(productionRecommendations)).resolves.toBeNull();
    await expect(cache.get(stagingCheckout)).resolves.toBe(snapshot);
    await expect(cache.get(stagingRecommendations)).resolves.toBe(snapshot);
  });

  it('clears all entries', async () => {
    const cache = createCache();
    const snapshot = createSnapshot();
    const first = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
    };
    const second = {
      projectKey: 'other-project',
      flagKey: 'recommendations',
    };

    await cache.set(first, snapshot);
    await cache.set(second, snapshot);

    await cache.clear();

    await expect(cache.get(first)).resolves.toBeNull();
    await expect(cache.get(second)).resolves.toBeNull();
  });
});
