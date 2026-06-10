import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  AuditTargetType,
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  Prisma,
  ServingMode,
} from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { createPageResponse } from '../common/dto/page-response.dto';
import {
  conflictError,
  notFoundError,
  validationError,
} from '../common/errors/api-exception.helpers';
import { RequestContextService } from '../common/request-context/request-context.service';
import { cleanAuditSnapshot } from '../common/utils/audit-snapshot.util';
import { TransactionService } from '../database/transaction.service';
import { EnvironmentsRepository } from '../repositories/environments.repository';
import { FeatureFlagsRepository } from '../repositories/feature-flags.repository';
import { FlagConfigsRepository } from '../repositories/flag-configs.repository';
import { ProjectsRepository } from '../repositories/projects.repository';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { FeatureFlagQueryDto } from './dto/feature-flag-query.dto';
import { FeatureFlagResponseDto } from './dto/feature-flag-response.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

const FLAG_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'key',
  'name',
  'status',
] as const;

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly environmentsRepository: EnvironmentsRepository,
    private readonly featureFlagsRepository: FeatureFlagsRepository,
    private readonly flagConfigsRepository: FlagConfigsRepository,
    private readonly transactionService: TransactionService,
    private readonly auditLogService: AuditLogService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(projectKey: string, query: FeatureFlagQueryDto) {
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const where: Prisma.FeatureFlagWhereInput = {
      projectId: project.id,
      lifecycleStatus: query.lifecycleStatus,
      ...(query.search
        ? {
            OR: [
              { key: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.status
        ? {
            environmentConfigs: {
              some: {
                status: query.status,
              },
            },
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(query);

    const [items, total] = await Promise.all([
      this.featureFlagsRepository.findMany(
        where,
        orderBy,
        query.limit,
        query.offset,
      ),
      this.featureFlagsRepository.count(where),
    ]);

    return createPageResponse(
      items.map((flag) => this.toResponse(project.key, flag)),
      query.limit,
      query.offset,
      total,
    );
  }

  async get(
    projectKey: string,
    flagKey: string,
  ): Promise<FeatureFlagResponseDto> {
    const { project, flag } = await this.getProjectAndFlag(projectKey, flagKey);

    return this.toResponse(project.key, flag);
  }

  async create(
    projectKey: string,
    body: CreateFeatureFlagDto,
  ): Promise<FeatureFlagResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const existing = await this.featureFlagsRepository.findByProjectIdAndKey(
      project.id,
      body.key,
    );

    if (existing) {
      throw conflictError(
        `Feature flag "${body.key}" already exists in project "${projectKey}".`,
      );
    }

    const created = await this.transactionService.run(async (tx) => {
      const environment =
        await this.environmentsRepository.findDefaultByProjectId(
          project.id,
          tx,
        );

      if (!environment) {
        throw notFoundError(
          `Default environment for project "${projectKey}" was not found.`,
        );
      }

      const flag = await this.featureFlagsRepository.create(
        {
          project: {
            connect: {
              id: project.id,
            },
          },
          key: body.key,
          name: body.name,
          description: body.description ?? null,
        },
        tx,
      );

      const config = await this.flagConfigsRepository.create(
        {
          projectId: project.id,
          flagId: flag.id,
          environmentId: environment.id,
          status: FlagConfigStatus.DISABLED,
          servingMode: ServingMode.TARGETED,
          killSwitch: false,
        },
        tx,
      );

      const snapshot = this.flagSnapshot(
        project.key,
        flag,
        config,
        environment.key,
      );

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: environment.id,
        environmentKey: environment.key,
        targetType: AuditTargetType.FEATURE_FLAG,
        targetId: flag.id,
        targetKey: flag.key,
        action: AuditAction.FEATURE_FLAG_CREATED,
        actor,
        before: null,
        after: snapshot,
        metadata: {
          source: 'api',
        },
        requestId,
      });

      return {
        ...flag,
        environmentConfigs: [
          {
            ...config,
            environment,
          },
        ],
      };
    });

    return this.toResponse(project.key, created);
  }

  async update(
    projectKey: string,
    flagKey: string,
    body: UpdateFeatureFlagDto,
  ): Promise<FeatureFlagResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const updated = await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const existingFlag =
        await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          flagKey,
          tx,
        );

      if (!existingFlag) {
        throw notFoundError(
          `Feature flag "${flagKey}" was not found in project "${projectKey}".`,
        );
      }

      const existingDefaultConfig = this.getDefaultConfig(existingFlag);

      const flag = await this.featureFlagsRepository.updateByProjectIdAndKey(
        project.id,
        flagKey,
        {
          name: body.name,
          description:
            body.description === undefined ? undefined : body.description,
        },
        tx,
      );

      const config = await this.flagConfigsRepository.updateById(
        existingDefaultConfig.id,
        {
          status: body.status,
          servingMode: body.servingMode,
          killSwitch: body.killSwitch,
        },
        tx,
      );

      const afterFlag =
        await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          flag.key,
          tx,
        );

      if (!afterFlag) {
        throw notFoundError(`Feature flag "${flag.key}" was not found.`);
      }

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: existingDefaultConfig.environmentId,
        environmentKey: existingDefaultConfig.environment.key,
        targetType: AuditTargetType.FEATURE_FLAG,
        targetId: flag.id,
        targetKey: flag.key,
        action: AuditAction.FEATURE_FLAG_UPDATED,
        actor,
        before: this.toSnapshot(project.key, existingFlag),
        after: this.toSnapshot(project.key, afterFlag),
        metadata: {
          source: 'api',
        },
        requestId,
      });

      return { project, flag: afterFlag };
    });

    return this.toResponse(updated.project.key, updated.flag);
  }

  async archive(
    projectKey: string,
    flagKey: string,
  ): Promise<FeatureFlagResponseDto> {
    return this.updateLifecycle(
      projectKey,
      flagKey,
      FeatureFlagLifecycleStatus.ARCHIVED,
      AuditAction.FEATURE_FLAG_ARCHIVED,
    );
  }

  async restore(
    projectKey: string,
    flagKey: string,
  ): Promise<FeatureFlagResponseDto> {
    return this.updateLifecycle(
      projectKey,
      flagKey,
      FeatureFlagLifecycleStatus.ACTIVE,
      AuditAction.FEATURE_FLAG_RESTORED,
    );
  }

  private async updateLifecycle(
    projectKey: string,
    flagKey: string,
    lifecycleStatus: FeatureFlagLifecycleStatus,
    action: AuditAction,
  ): Promise<FeatureFlagResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const result = await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const existingFlag =
        await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          flagKey,
          tx,
        );

      if (!existingFlag) {
        throw notFoundError(
          `Feature flag "${flagKey}" was not found in project "${projectKey}".`,
        );
      }

      const updatedFlag =
        await this.featureFlagsRepository.updateByProjectIdAndKey(
          project.id,
          flagKey,
          {
            lifecycleStatus,
            archivedAt:
              lifecycleStatus === FeatureFlagLifecycleStatus.ARCHIVED
                ? new Date()
                : null,
          },
          tx,
        );

      const afterFlag =
        await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          updatedFlag.key,
          tx,
        );

      if (!afterFlag) {
        throw notFoundError(`Feature flag "${updatedFlag.key}" was not found.`);
      }

      const config = this.getDefaultConfig(afterFlag);

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: config.environmentId,
        environmentKey: config.environment.key,
        targetType: AuditTargetType.FEATURE_FLAG,
        targetId: updatedFlag.id,
        targetKey: updatedFlag.key,
        action,
        actor,
        before: this.toSnapshot(project.key, existingFlag),
        after: this.toSnapshot(project.key, afterFlag),
        metadata: {
          source: 'api',
        },
        requestId,
      });

      return { project, flag: afterFlag };
    });

    return this.toResponse(result.project.key, result.flag);
  }

  private async getProjectAndFlag(projectKey: string, flagKey: string) {
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const flag =
      await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
        project.id,
        flagKey,
      );

    if (!flag) {
      throw notFoundError(
        `Feature flag "${flagKey}" was not found in project "${projectKey}".`,
      );
    }

    return { project, flag };
  }

  private getDefaultConfig(flag: {
    environmentConfigs: Array<{
      id: string;
      environmentId: string;
      status: FlagConfigStatus;
      servingMode: ServingMode;
      killSwitch: boolean;
      environment: { key: string; isDefault: boolean };
    }>;
  }) {
    const config = flag.environmentConfigs.find(
      (item) => item.environment.isDefault,
    );

    if (!config) {
      throw notFoundError('Default flag environment config was not found.');
    }

    return config;
  }

  private buildOrderBy(
    query: FeatureFlagQueryDto,
  ): Prisma.FeatureFlagOrderByWithRelationInput {
    const sort = query.sort ?? 'createdAt';

    if (!FLAG_SORT_FIELDS.includes(sort as (typeof FLAG_SORT_FIELDS)[number])) {
      throw validationError('Unsupported feature flag sort field.', [
        {
          field: 'sort',
          message: `Allowed values: ${FLAG_SORT_FIELDS.join(', ')}.`,
        },
      ]);
    }

    if (sort === 'status') {
      return {
        createdAt: query.order ?? 'desc',
      };
    }

    return {
      [sort]: query.order ?? 'desc',
    };
  }

  private getRequiredActor(): string {
    const actor = this.requestContext.getActor();

    if (!actor) {
      throw validationError(
        'X-Actor header is required for mutation requests.',
        [
          {
            field: 'X-Actor',
            message:
              'Provide X-Actor header so configuration changes can be audited.',
          },
        ],
      );
    }

    return actor;
  }

  private toSnapshot(
    projectKey: string,
    flag: {
      id: string;
      key: string;
      name: string;
      description: string | null;
      lifecycleStatus: FeatureFlagLifecycleStatus;
      archivedAt: Date | null;
      environmentConfigs: Array<{
        id: string;
        environmentId: string;
        status: FlagConfigStatus;
        servingMode: ServingMode;
        killSwitch: boolean;
        environment: { key: string; isDefault: boolean };
      }>;
    },
  ) {
    const config = this.getDefaultConfig(flag);

    return this.flagSnapshot(projectKey, flag, config, config.environment.key);
  }

  private flagSnapshot(
    projectKey: string,
    flag: {
      id: string;
      key: string;
      name: string;
      description: string | null;
      lifecycleStatus: FeatureFlagLifecycleStatus;
      archivedAt: Date | null;
    },
    config: {
      status: FlagConfigStatus;
      servingMode: ServingMode;
      killSwitch: boolean;
    },
    environmentKey: string,
  ) {
    return cleanAuditSnapshot({
      id: flag.id,
      projectKey,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      lifecycleStatus: flag.lifecycleStatus,
      status: config.status,
      servingMode: config.servingMode,
      killSwitch: config.killSwitch,
      environmentKey,
      archivedAt: flag.archivedAt,
    });
  }

  private toResponse(
    projectKey: string,
    flag: {
      id: string;
      key: string;
      name: string;
      description: string | null;
      lifecycleStatus: FeatureFlagLifecycleStatus;
      archivedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      environmentConfigs: Array<{
        status: FlagConfigStatus;
        servingMode: ServingMode;
        killSwitch: boolean;
        environment?: { key: string; isDefault: boolean };
      }>;
    },
  ): FeatureFlagResponseDto {
    const config =
      flag.environmentConfigs.find((item) => item.environment?.isDefault) ??
      flag.environmentConfigs[0];

    return {
      id: flag.id,
      projectKey,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      lifecycleStatus: flag.lifecycleStatus,
      status: config?.status ?? FlagConfigStatus.DISABLED,
      servingMode: config?.servingMode ?? ServingMode.TARGETED,
      killSwitch: config?.killSwitch ?? false,
      environmentKey: config?.environment?.key ?? 'production',
      archivedAt: flag.archivedAt,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    };
  }
}
