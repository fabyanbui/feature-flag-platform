import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

export interface IncrementEvaluationMetricInput {
  projectId: string | null;
  environmentId: string | null;
  flagId: string | null;
  projectKey: string;
  environmentKey: string;
  flagKey: string;
  bucketStart: Date;
  reason: string;
  enabled: boolean;
}

@Injectable()
export class EvaluationMetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  increment(
    input: IncrementEvaluationMetricInput,
    db: RepositoryClient = this.prisma,
  ) {
    const create: Prisma.FlagEvaluationMetricUncheckedCreateInput = {
      projectId: input.projectId,
      environmentId: input.environmentId,
      flagId: input.flagId,
      projectKey: input.projectKey,
      environmentKey: input.environmentKey,
      flagKey: input.flagKey,
      bucketStart: input.bucketStart,
      reason: input.reason,
      enabled: input.enabled,
      count: 1,
    };

    return db.flagEvaluationMetric.upsert({
      where: {
        metricBucket: {
          projectKey: input.projectKey,
          environmentKey: input.environmentKey,
          flagKey: input.flagKey,
          bucketStart: input.bucketStart,
          reason: input.reason,
          enabled: input.enabled,
        },
      },
      create,
      update: {
        count: {
          increment: 1,
        },
      },
    });
  }
}
