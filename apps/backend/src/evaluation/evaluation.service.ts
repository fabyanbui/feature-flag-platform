import { Inject, Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from '../common/request-context/request-context.service';
import {
  EvaluationMetricsService,
  UNRESOLVED_ENVIRONMENT_KEY,
} from '../stats/evaluation-metrics.service';
import {
  EVALUATION_SNAPSHOT_CACHE,
  type EvaluationSnapshotCache,
  type EvaluationSnapshotCacheAddress,
} from './cache/evaluation-snapshot-cache';
import { EvaluateRequestDto } from './dto/evaluate-request.dto';
import {
  errorResult,
  evaluateFlag,
  notFoundResult,
} from './engine/evaluation-engine';
import type {
  EvaluationInput,
  EvaluationResult,
  EvaluationSnapshot,
} from './engine/evaluation.types';
import { EvaluationRepository } from './evaluation.repository';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly requestContext: RequestContextService,
    @Inject(EVALUATION_SNAPSHOT_CACHE)
    private readonly snapshotCache: EvaluationSnapshotCache,
    private readonly evaluationMetricsService: EvaluationMetricsService,
  ) {}

  async evaluate(request: EvaluateRequestDto) {
    const input: EvaluationInput = {
      projectKey: request.projectKey,
      flagKey: request.flagKey,
      context: request.context,
    };

    const cacheAddress: EvaluationSnapshotCacheAddress = {
      projectKey: request.projectKey,
      environmentKey: request.environmentKey,
      flagKey: request.flagKey,
    };

    let snapshot: EvaluationSnapshot | null = null;
    let result: EvaluationResult;

    try {
      snapshot = await this.getCachedSnapshotSafely(cacheAddress);

      if (!snapshot) {
        snapshot = await this.evaluationRepository.findSnapshot(cacheAddress);

        if (snapshot) {
          await this.storeSnapshotSafely(cacheAddress, snapshot);
        }
      }

      result = snapshot ? evaluateFlag(input, snapshot) : notFoundResult(input);
    } catch (error) {
      this.logger.error(
        `Evaluation failed safely. requestId=${this.requestContext.getRequestId()}`,
        error instanceof Error ? error.stack : String(error),
      );

      result = errorResult(input);
    }

    this.recordMetricSafely(request, result, snapshot);

    return result;
  }

  private recordMetricSafely(
    request: EvaluateRequestDto,
    result: EvaluationResult,
    snapshot: EvaluationSnapshot | null,
  ): void {
    try {
      const resolution = snapshot?.resolution;

      this.evaluationMetricsService.record({
        ...(resolution
          ? {
              projectId: resolution.projectId,
              environmentId: resolution.environmentId,
              flagId: resolution.flagId,
            }
          : {}),
        projectKey: result.projectKey,
        environmentKey:
          resolution?.environmentKey ??
          request.environmentKey ??
          UNRESOLVED_ENVIRONMENT_KEY,
        flagKey: result.flagKey,
        reason: result.reason,
        enabled: result.enabled,
      });
    } catch (error) {
      this.logger.warn(
        'Evaluation metric recording failed; evaluation response was preserved.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async getCachedSnapshotSafely(
    address: EvaluationSnapshotCacheAddress,
  ): Promise<EvaluationSnapshot | null> {
    try {
      const snapshot = await this.snapshotCache.get(address);

      this.logger.debug(
        `Evaluation snapshot cache ${snapshot ? 'hit' : 'miss'}. ` +
          `projectKey=${address.projectKey} ` +
          `environmentKey=${address.environmentKey ?? 'default'} ` +
          `flagKey=${address.flagKey}`,
      );

      return snapshot;
    } catch (error) {
      this.logger.warn(
        `Evaluation snapshot cache read failed; falling back to repository. ` +
          `projectKey=${address.projectKey} ` +
          `environmentKey=${address.environmentKey ?? 'default'} ` +
          `flagKey=${address.flagKey}`,
        error instanceof Error ? error.stack : String(error),
      );

      return null;
    }
  }

  private async storeSnapshotSafely(
    address: EvaluationSnapshotCacheAddress,
    snapshot: EvaluationSnapshot,
  ): Promise<void> {
    try {
      await this.snapshotCache.set(address, snapshot);
    } catch (error) {
      this.logger.warn(
        `Evaluation snapshot cache write failed; continuing without cache. ` +
          `projectKey=${address.projectKey} ` +
          `environmentKey=${address.environmentKey ?? 'default'} ` +
          `flagKey=${address.flagKey}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
