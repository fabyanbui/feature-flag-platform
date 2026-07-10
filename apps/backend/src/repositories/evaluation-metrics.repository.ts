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

export interface EvaluationMetricRangeInput {
  projectKey: string;
  environmentKey: string;
  from: Date;
  to: Date;
}

export interface FlagEvaluationMetricRangeInput extends EvaluationMetricRangeInput {
  flagKey: string;
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

  findProjectReasonBreakdown(input: EvaluationMetricRangeInput) {
    return this.prisma.flagEvaluationMetric.groupBy({
      by: ['flagKey', 'reason', 'enabled'],
      where: {
        projectKey: input.projectKey,
        environmentKey: input.environmentKey,
        bucketStart: {
          gte: input.from,
          lt: input.to,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: [
        {
          flagKey: 'asc',
        },
        {
          reason: 'asc',
        },
        {
          enabled: 'desc',
        },
      ],
    });
  }

  findFlagReasonBreakdown(input: FlagEvaluationMetricRangeInput) {
    return this.prisma.flagEvaluationMetric.groupBy({
      by: ['reason', 'enabled'],
      where: {
        projectKey: input.projectKey,
        environmentKey: input.environmentKey,
        flagKey: input.flagKey,
        bucketStart: {
          gte: input.from,
          lt: input.to,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: [
        {
          reason: 'asc',
        },
        {
          enabled: 'desc',
        },
      ],
    });
  }

  findFlagBucketBreakdown(input: FlagEvaluationMetricRangeInput) {
    return this.prisma.flagEvaluationMetric.groupBy({
      by: ['bucketStart', 'enabled'],
      where: {
        projectKey: input.projectKey,
        environmentKey: input.environmentKey,
        flagKey: input.flagKey,
        bucketStart: {
          gte: input.from,
          lt: input.to,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: [
        {
          bucketStart: 'asc',
        },
        {
          enabled: 'desc',
        },
      ],
    });
  }
}
