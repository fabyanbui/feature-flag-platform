import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EVALUATION_SNAPSHOT_CACHE } from './evaluation-snapshot-cache';
import { InMemoryEvaluationSnapshotCache } from './in-memory-evaluation-snapshot-cache';

@Module({
  imports: [ConfigModule],
  providers: [
    InMemoryEvaluationSnapshotCache,
    {
      provide: EVALUATION_SNAPSHOT_CACHE,
      useExisting: InMemoryEvaluationSnapshotCache,
    },
  ],
  exports: [EVALUATION_SNAPSHOT_CACHE],
})
export class EvaluationCacheModule {}
