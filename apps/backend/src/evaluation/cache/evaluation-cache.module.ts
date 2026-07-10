import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EvaluationCacheInvalidator } from './evaluation-cache-invalidator';
import {
  EVALUATION_SNAPSHOT_CACHE,
  type EvaluationSnapshotCache,
} from './evaluation-snapshot-cache';
import { InMemoryEvaluationSnapshotCache } from './in-memory-evaluation-snapshot-cache';
import { NoopEvaluationSnapshotCache } from './noop-evaluation-snapshot-cache';
import { RedisEvaluationSnapshotCache } from './redis-evaluation-snapshot-cache';

export type EvaluationCacheProviderName = 'memory' | 'none' | 'redis';

export function resolveEvaluationCacheProviderName(
  configuredProvider: string | undefined,
): EvaluationCacheProviderName {
  const normalizedProvider = configuredProvider?.trim().toLowerCase();

  if (
    normalizedProvider === 'none' ||
    normalizedProvider === 'memory' ||
    normalizedProvider === 'redis'
  ) {
    return normalizedProvider;
  }

  return 'memory';
}

@Module({
  imports: [ConfigModule],
  providers: [
    InMemoryEvaluationSnapshotCache,
    NoopEvaluationSnapshotCache,
    RedisEvaluationSnapshotCache,
    {
      provide: EVALUATION_SNAPSHOT_CACHE,
      useFactory: (
        configService: ConfigService,
        inMemoryCache: InMemoryEvaluationSnapshotCache,
        noopCache: NoopEvaluationSnapshotCache,
        redisCache: RedisEvaluationSnapshotCache,
      ): EvaluationSnapshotCache => {
        const providerName = resolveEvaluationCacheProviderName(
          configService.get<string>('EVALUATION_CACHE_PROVIDER'),
        );

        switch (providerName) {
          case 'none':
            return noopCache;
          case 'redis':
            return redisCache;
          case 'memory':
            return inMemoryCache;
        }
      },
      inject: [
        ConfigService,
        InMemoryEvaluationSnapshotCache,
        NoopEvaluationSnapshotCache,
        RedisEvaluationSnapshotCache,
      ],
    },
    EvaluationCacheInvalidator,
  ],
  exports: [EVALUATION_SNAPSHOT_CACHE, EvaluationCacheInvalidator],
})
export class EvaluationCacheModule {}
