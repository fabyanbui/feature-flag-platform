import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EVALUATION_SNAPSHOT_CACHE,
  type EvaluationSnapshotCache,
} from './evaluation-snapshot-cache';

@Injectable()
export class EvaluationCacheInvalidator {
  private readonly logger = new Logger(EvaluationCacheInvalidator.name);

  constructor(
    @Inject(EVALUATION_SNAPSHOT_CACHE)
    private readonly snapshotCache: EvaluationSnapshotCache,
  ) {}

  async invalidateFlag(
    projectKey: string,
    flagKey: string,
    environmentKey?: string,
  ): Promise<void> {
    try {
      await this.snapshotCache.invalidateFlag({
        projectKey,
        flagKey,
        environmentKey,
      });

      this.logger.debug(
        `Invalidated evaluation snapshot. ` +
          `projectKey=${projectKey} ` +
          `environmentKey=${environmentKey ?? 'all'} ` +
          `flagKey=${flagKey}`,
      );
    } catch (error) {
      this.logFailure(projectKey, [flagKey], environmentKey, error);
    }
  }

  async invalidateFlags(
    projectKey: string,
    flagKeys: string[],
    environmentKey?: string,
  ): Promise<void> {
    const uniqueFlagKeys = [...new Set(flagKeys)];

    if (uniqueFlagKeys.length === 0) {
      return;
    }

    try {
      await this.snapshotCache.invalidateFlags({
        projectKey,
        flagKeys: uniqueFlagKeys,
        environmentKey,
      });

      this.logger.debug(
        `Invalidated evaluation snapshots. ` +
          `projectKey=${projectKey} ` +
          `environmentKey=${environmentKey ?? 'all'} ` +
          `flagCount=${uniqueFlagKeys.length}`,
      );
    } catch (error) {
      this.logFailure(projectKey, uniqueFlagKeys, environmentKey, error);
    }
  }

  private logFailure(
    projectKey: string,
    flagKeys: string[],
    environmentKey: string | undefined,
    error: unknown,
  ): void {
    this.logger.warn(
      `Evaluation snapshot invalidation failed; committed mutation remains successful. ` +
        `projectKey=${projectKey} ` +
        `environmentKey=${environmentKey ?? 'all'} ` +
        `flagCount=${flagKeys.length}`,
      error instanceof Error ? error.stack : String(error),
    );
  }
}
