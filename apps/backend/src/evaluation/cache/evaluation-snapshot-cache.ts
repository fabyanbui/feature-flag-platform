import type { EvaluationSnapshot } from '../engine/evaluation.types';

export const EVALUATION_SNAPSHOT_CACHE = Symbol('EVALUATION_SNAPSHOT_CACHE');

export const DEFAULT_ENVIRONMENT_CACHE_SCOPE = '__default__';

export interface EvaluationSnapshotCacheAddress {
  projectKey: string;
  environmentKey?: string;
  flagKey: string;
}

export interface EvaluationSnapshotInvalidationTarget {
  projectKey: string;
  flagKeys: string[];
  environmentKey?: string;
}

export interface EvaluationSnapshotCache {
  get(
    address: EvaluationSnapshotCacheAddress,
  ): Promise<EvaluationSnapshot | null>;

  set(
    address: EvaluationSnapshotCacheAddress,
    snapshot: EvaluationSnapshot,
  ): Promise<void>;

  /**
   * When environmentKey is omitted, invalidate every environment scope for
   * the flag. Environment-scoped invalidation must also remove the default
   * environment alias when the provider cannot prove they are different.
   */
  invalidateFlag(address: EvaluationSnapshotCacheAddress): Promise<void>;

  /**
   * When environmentKey is omitted, invalidate every environment scope for
   * all listed flags.
   */
  invalidateFlags(target: EvaluationSnapshotInvalidationTarget): Promise<void>;

  clear(): Promise<void>;
}

export function buildEvaluationSnapshotCacheKey(
  address: EvaluationSnapshotCacheAddress,
): string {
  const environmentScope =
    address.environmentKey ?? DEFAULT_ENVIRONMENT_CACHE_SCOPE;

  return [
    'evaluation-snapshot',
    address.projectKey,
    environmentScope,
    address.flagKey,
  ].join(':');
}
