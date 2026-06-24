import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
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
    } finally {
      await testingModule.close();
    }
  });
});
