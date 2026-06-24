import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EvaluationCacheInvalidator } from './evaluation-cache-invalidator';
import { EvaluationCacheModule } from './evaluation-cache.module';
import {
  EVALUATION_SNAPSHOT_CACHE,
  type EvaluationSnapshotCache,
} from './evaluation-snapshot-cache';
import { InMemoryEvaluationSnapshotCache } from './in-memory-evaluation-snapshot-cache';

describe('EvaluationCacheModule', () => {
  it('exposes the in-memory provider through the cache token', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
        }),
        EvaluationCacheModule,
      ],
    }).compile();

    try {
      const cache = testingModule.get<EvaluationSnapshotCache>(
        EVALUATION_SNAPSHOT_CACHE,
      );

      expect(cache).toBeInstanceOf(InMemoryEvaluationSnapshotCache);

      const invalidator = testingModule.get(EvaluationCacheInvalidator);

      expect(invalidator).toBeInstanceOf(EvaluationCacheInvalidator);
    } finally {
      await testingModule.close();
    }
  });
});
