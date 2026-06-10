import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { EvaluationSnapshot } from './engine/evaluation.types';

export interface FindEvaluationSnapshotInput {
  projectKey: string;
  environmentKey?: string;
  flagKey: string;
}

@Injectable()
export class EvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSnapshot(
    input: FindEvaluationSnapshotInput,
  ): Promise<EvaluationSnapshot | null> {
    const project = await this.prisma.project.findUnique({
      where: {
        key: input.projectKey,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return null;
    }

    const environment = await this.prisma.environment.findFirst({
      where: input.environmentKey
        ? {
            projectId: project.id,
            key: input.environmentKey,
          }
        : {
            projectId: project.id,
            isDefault: true,
          },
      select: {
        id: true,
      },
    });

    if (!environment) {
      return null;
    }

    const flag = await this.prisma.featureFlag.findUnique({
      where: {
        projectId_key: {
          projectId: project.id,
          key: input.flagKey,
        },
      },
      select: {
        id: true,
        lifecycleStatus: true,
      },
    });

    if (!flag) {
      return null;
    }

    const config = await this.prisma.flagEnvironmentConfig.findUnique({
      where: {
        flagId_environmentId: {
          flagId: flag.id,
          environmentId: environment.id,
        },
      },
      select: {
        status: true,
        servingMode: true,
        killSwitch: true,
        rules: {
          select: {
            id: true,
            type: true,
            priority: true,
            enabled: true,
            parameters: true,
          },
          orderBy: {
            priority: 'asc',
          },
        },
      },
    });

    if (!config) {
      return null;
    }

    return {
      flag: {
        lifecycleStatus: flag.lifecycleStatus,
      },
      config: {
        status: config.status,
        servingMode: config.servingMode,
        killSwitch: config.killSwitch,
      },
      rules: config.rules,
    };
  }
}
