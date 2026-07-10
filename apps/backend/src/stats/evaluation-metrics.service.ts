import { Injectable, Logger } from '@nestjs/common';
import { EvaluationReason } from '../evaluation/engine/evaluation.types';
import { EvaluationMetricsRepository } from '../repositories/evaluation-metrics.repository';

export const UNRESOLVED_ENVIRONMENT_KEY = '__unresolved__';

export interface RecordEvaluationMetricInput {
  projectId?: string | null;
  environmentId?: string | null;
  flagId?: string | null;
  projectKey: string;
  environmentKey: string;
  flagKey: string;
  reason: EvaluationReason;
  enabled: boolean;
}

@Injectable()
export class EvaluationMetricsService {
  private readonly logger = new Logger(EvaluationMetricsService.name);

  constructor(
    private readonly evaluationMetricsRepository: EvaluationMetricsRepository,
  ) {}

  record(input: RecordEvaluationMetricInput): void {
    void this.persist(input);
  }

  private async persist(input: RecordEvaluationMetricInput): Promise<void> {
    try {
      await this.evaluationMetricsRepository.increment({
        projectId: input.projectId ?? null,
        environmentId: input.environmentId ?? null,
        flagId: input.flagId ?? null,
        projectKey: input.projectKey,
        environmentKey: input.environmentKey,
        flagKey: input.flagKey,
        bucketStart: startOfUtcHour(new Date()),
        reason: input.reason,
        enabled: input.enabled,
      });
    } catch (error) {
      this.logger.warn(
        'Evaluation metric write failed; evaluation response was preserved.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

export function startOfUtcHour(date: Date): Date {
  const bucketStart = new Date(date);

  bucketStart.setUTCMinutes(0, 0, 0);

  return bucketStart;
}
