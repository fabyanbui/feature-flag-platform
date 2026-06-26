import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EvaluationCacheInvalidator } from './evaluation-cache-invalidator';
import {
  EvaluationCacheModule,
  resolveEvaluationCacheProviderName,
} from './evaluation-cache.module';
import {
  EVALUATION_SNAPSHOT_CACHE,
  type EvaluationSnapshotCache,
} from './evaluation-snapshot-cache';
import { InMemoryEvaluationSnapshotCache } from './in-memory-evaluation-snapshot-cache';
import { NoopEvaluationSnapshotCache } from './noop-evaluation-snapshot-cache';
import { RedisEvaluationSnapshotCache } from './redis-evaluation-snapshot-cache';

describe('resolveEvaluationCacheProviderName', () => {
  it.each([
    [undefined, 'memory'],
    ['', 'memory'],
    ['unknown', 'memory'],
    ['memory', 'memory'],
    [' MEMORY ', 'memory'],
    ['none', 'none'],
    ['redis', 'redis'],
  ] as const)('maps %p to %p', (configuredProvider, expectedProvider) => {
    expect(resolveEvaluationCacheProviderName(configuredProvider)).toBe(
      expectedProvider,
    );
  });
});

describe('EvaluationCacheModule', () => {
  async function createTestingModule(configuredProvider?: string) {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'EVALUATION_CACHE_PROVIDER') {
          return configuredProvider;
        }

        return undefined;
      }),
    };

    return Test.createTestingModule({
      imports: [EvaluationCacheModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();
  }

  it.each([
    [undefined, InMemoryEvaluationSnapshotCache],
    ['memory', InMemoryEvaluationSnapshotCache],
    ['invalid', InMemoryEvaluationSnapshotCache],
    ['none', NoopEvaluationSnapshotCache],
    ['redis', RedisEvaluationSnapshotCache],
  ] as const)(
    'exposes %p provider through the cache token',
    async (configuredProvider, expectedProvider) => {
      const testingModule = await createTestingModule(configuredProvider);

      try {
        const cache = testingModule.get<EvaluationSnapshotCache>(
          EVALUATION_SNAPSHOT_CACHE,
        );

        expect(cache).toBeInstanceOf(expectedProvider);

        const invalidator = testingModule.get(EvaluationCacheInvalidator);

        expect(invalidator).toBeInstanceOf(EvaluationCacheInvalidator);
      } finally {
        await testingModule.close();
      }
    },
  );
});
