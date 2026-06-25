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
        key: true,
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
        groupId: true,
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

    const groupId = flag.groupId;
    const groupStateRequired =
      groupId !== null &&
      flag.lifecycleStatus !== 'ARCHIVED' &&
      config.status !== 'DISABLED';
    const groupConfig = groupStateRequired
      ? await this.prisma.flagGroupConfig.findUnique({
          where: {
            groupId_environmentId: {
              groupId,
              environmentId: environment.id,
            },
          },
          select: {
            killSwitch: true,
          },
        })
      : null;

    if (groupStateRequired && !groupConfig) {
      throw new Error(
        `Missing flag group config for group "${flag.groupId}" and environment "${environment.id}".`,
      );
    }

    return {
      resolution: {
        projectId: project.id,
        environmentId: environment.id,
        flagId: flag.id,
        environmentKey: environment.key,
      },
      flag: {
        lifecycleStatus: flag.lifecycleStatus,
      },
      group: groupConfig
        ? {
            killSwitch: groupConfig.killSwitch,
          }
        : null,
      config: {
        status: config.status,
        servingMode: config.servingMode,
        killSwitch: config.killSwitch,
      },
      rules: config.rules,
    };
  }
}
