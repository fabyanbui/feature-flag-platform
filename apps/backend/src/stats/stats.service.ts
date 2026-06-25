import { Injectable } from '@nestjs/common';
import { createPageResponse } from '../common/dto/page-response.dto';
import { notFoundError } from '../common/errors/api-exception.helpers';
import { EvaluationReason } from '../evaluation/engine/evaluation.types';
import { EnvironmentsRepository } from '../repositories/environments.repository';
import { EvaluationMetricsRepository } from '../repositories/evaluation-metrics.repository';
import { FeatureFlagsRepository } from '../repositories/feature-flags.repository';
import { ProjectsRepository } from '../repositories/projects.repository';
import { FlagStatsQueryDto } from './dto/flag-stats-query.dto';
import {
  ProjectFlagStatsQueryDto,
  type ProjectFlagStatsSortField,
} from './dto/project-flag-stats-query.dto';
import type {
  EvaluationReasonCountDto,
  EvaluationTimeBucketDto,
  FlagStatsResponseDto,
  FlagStatsSummaryDto,
} from './dto/stats-response.dto';
import { normalizeStatsTimeRange } from './stats-time-range';

const TOP_REASON_LIMIT = 3;

type ReasonRow = {
  reason: string;
  enabled: boolean;
  _sum: {
    count: number | null;
  };
};

type ProjectReasonRow = ReasonRow & {
  flagKey: string;
};

type BucketRow = {
  bucketStart: Date;
  enabled: boolean;
  _sum: {
    count: number | null;
  };
};

@Injectable()
export class StatsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly environmentsRepository: EnvironmentsRepository,
    private readonly featureFlagsRepository: FeatureFlagsRepository,
    private readonly evaluationMetricsRepository: EvaluationMetricsRepository,
  ) {}

  async listFlagStats(projectKey: string, query: ProjectFlagStatsQueryDto) {
    const { project, environment } = await this.resolveScope(
      projectKey,
      query.environmentKey,
    );
    const range = normalizeStatsTimeRange(query);
    const rows =
      await this.evaluationMetricsRepository.findProjectReasonBreakdown({
        projectKey: project.key,
        environmentKey: environment.key,
        ...range,
      });

    const summaries = this.buildProjectSummaries(rows);
    const sorted = this.sortSummaries(
      summaries,
      query.sort ?? 'totalEvaluations',
      query.order ?? 'desc',
    );
    const items = sorted.slice(query.offset, query.offset + query.limit);

    return createPageResponse(items, query.limit, query.offset, sorted.length);
  }

  async getFlagStats(
    projectKey: string,
    flagKey: string,
    query: FlagStatsQueryDto,
  ): Promise<FlagStatsResponseDto> {
    const { project, environment } = await this.resolveScope(
      projectKey,
      query.environmentKey,
    );
    const flag = await this.featureFlagsRepository.findByProjectIdAndKey(
      project.id,
      flagKey,
    );

    if (!flag) {
      throw notFoundError(
        `Feature flag "${flagKey}" was not found in project "${projectKey}".`,
      );
    }

    const range = normalizeStatsTimeRange(query);
    const input = {
      projectKey: project.key,
      environmentKey: environment.key,
      flagKey: flag.key,
      ...range,
    };
    const [reasonRows, bucketRows] = await Promise.all([
      this.evaluationMetricsRepository.findFlagReasonBreakdown(input),
      this.evaluationMetricsRepository.findFlagBucketBreakdown(input),
    ]);
    const reasons = this.toReasonCounts(reasonRows);
    const enabledCount = this.sumReasonCounts(reasons, true);
    const disabledCount = this.sumReasonCounts(reasons, false);
    const totalEvaluations = enabledCount + disabledCount;

    return {
      projectKey: project.key,
      flagKey: flag.key,
      environmentKey: environment.key,
      from: range.from,
      to: range.to,
      totalEvaluations,
      enabledCount,
      disabledCount,
      enabledPercentage:
        totalEvaluations === 0
          ? 0
          : this.roundPercentage((enabledCount / totalEvaluations) * 100),
      reasons,
      buckets: this.buildBuckets(bucketRows),
    };
  }

  private async resolveScope(projectKey: string, environmentKey?: string) {
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const environment = environmentKey
      ? await this.environmentsRepository.findByProjectIdAndKey(
          project.id,
          environmentKey,
        )
      : await this.environmentsRepository.findDefaultByProjectId(project.id);

    if (!environment) {
      throw notFoundError(
        environmentKey
          ? `Environment "${environmentKey}" was not found in project "${projectKey}".`
          : `Default environment for project "${projectKey}" was not found.`,
      );
    }

    return { project, environment };
  }

  private buildProjectSummaries(
    rows: ProjectReasonRow[],
  ): FlagStatsSummaryDto[] {
    const rowsByFlag = new Map<string, ReasonRow[]>();

    for (const row of rows) {
      const existing = rowsByFlag.get(row.flagKey) ?? [];

      existing.push(row);
      rowsByFlag.set(row.flagKey, existing);
    }

    return [...rowsByFlag.entries()].map(([flagKey, reasonRows]) => {
      const reasons = this.toReasonCounts(reasonRows);
      const enabledCount = this.sumReasonCounts(reasons, true);
      const disabledCount = this.sumReasonCounts(reasons, false);

      return {
        flagKey,
        totalEvaluations: enabledCount + disabledCount,
        enabledCount,
        disabledCount,
        topReasons: [...reasons]
          .sort((left, right) => {
            if (left.count !== right.count) {
              return right.count - left.count;
            }

            const reasonComparison = left.reason.localeCompare(right.reason);

            if (reasonComparison !== 0) {
              return reasonComparison;
            }

            return Number(right.enabled) - Number(left.enabled);
          })
          .slice(0, TOP_REASON_LIMIT),
      };
    });
  }

  private toReasonCounts(rows: ReasonRow[]): EvaluationReasonCountDto[] {
    return rows.map((row) => ({
      reason: row.reason as EvaluationReason,
      enabled: row.enabled,
      count: row._sum.count ?? 0,
    }));
  }

  private sumReasonCounts(
    reasons: EvaluationReasonCountDto[],
    enabled: boolean,
  ): number {
    return reasons
      .filter((reason) => reason.enabled === enabled)
      .reduce((total, reason) => total + reason.count, 0);
  }

  private buildBuckets(rows: BucketRow[]): EvaluationTimeBucketDto[] {
    const buckets = new Map<string, EvaluationTimeBucketDto>();

    for (const row of rows) {
      const key = row.bucketStart.toISOString();
      const count = row._sum.count ?? 0;
      const existing = buckets.get(key) ?? {
        bucketStart: row.bucketStart,
        totalEvaluations: 0,
        enabledCount: 0,
        disabledCount: 0,
      };

      existing.totalEvaluations += count;

      if (row.enabled) {
        existing.enabledCount += count;
      } else {
        existing.disabledCount += count;
      }

      buckets.set(key, existing);
    }

    return [...buckets.values()].sort(
      (left, right) => left.bucketStart.getTime() - right.bucketStart.getTime(),
    );
  }

  private sortSummaries(
    summaries: FlagStatsSummaryDto[],
    sort: ProjectFlagStatsSortField,
    order: 'asc' | 'desc',
  ): FlagStatsSummaryDto[] {
    const direction = order === 'asc' ? 1 : -1;

    return [...summaries].sort((left, right) => {
      const comparison =
        sort === 'flagKey'
          ? left.flagKey.localeCompare(right.flagKey)
          : left[sort] - right[sort];

      if (comparison !== 0) {
        return comparison * direction;
      }

      return left.flagKey.localeCompare(right.flagKey);
    });
  }

  private roundPercentage(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
