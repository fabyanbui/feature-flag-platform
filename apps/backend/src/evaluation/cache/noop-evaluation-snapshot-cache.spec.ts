import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';
import type { EvaluationSnapshot } from '../engine/evaluation.types';
import { NoopEvaluationSnapshotCache } from './noop-evaluation-snapshot-cache';

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

describe('NoopEvaluationSnapshotCache', () => {
  let cache: NoopEvaluationSnapshotCache;

  beforeEach(() => {
    cache = new NoopEvaluationSnapshotCache();
  });

  it('always misses so evaluation falls back to the repository', async () => {
    await expect(
      cache.get({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeNull();
  });

  it('accepts writes without storing snapshots', async () => {
    const address = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    };

    await expect(cache.set(address, createSnapshot())).resolves.toBeUndefined();
    await expect(cache.get(address)).resolves.toBeNull();
  });

  it('accepts invalidation and clear operations as no-ops', async () => {
    await expect(
      cache.invalidateFlag({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).resolves.toBeUndefined();
    await expect(
      cache.invalidateFlags({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKeys: ['new-checkout', 'recommendations'],
      }),
    ).resolves.toBeUndefined();
    await expect(cache.clear()).resolves.toBeUndefined();
  });
});
