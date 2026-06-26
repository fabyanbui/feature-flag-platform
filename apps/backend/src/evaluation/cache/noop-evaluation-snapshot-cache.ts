import { Injectable } from '@nestjs/common';
import type { EvaluationSnapshotCache } from './evaluation-snapshot-cache';

@Injectable()
export class NoopEvaluationSnapshotCache implements EvaluationSnapshotCache {
  get(): Promise<null> {
    return Promise.resolve(null);
  }

  set(): Promise<void> {
    return Promise.resolve();
  }

  invalidateFlag(): Promise<void> {
    return Promise.resolve();
  }

  invalidateFlags(): Promise<void> {
    return Promise.resolve();
  }

  clear(): Promise<void> {
    return Promise.resolve();
  }
}
