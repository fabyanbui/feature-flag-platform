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
import { EvaluationCacheInvalidator } from '../evaluation/cache/evaluation-cache-invalidator';
import { FeatureFlagResponseDto } from '../feature-flags/dto/feature-flag-response.dto';
import { EnvironmentsRepository } from '../repositories/environments.repository';
import { FeatureFlagsRepository } from '../repositories/feature-flags.repository';
import { FlagGroupConfigsRepository } from '../repositories/flag-group-configs.repository';
import { FlagGroupsRepository } from '../repositories/flag-groups.repository';
import { ProjectsRepository } from '../repositories/projects.repository';
import { AssignFlagGroupDto } from './dto/assign-flag-group.dto';
import { CreateFlagGroupDto } from './dto/create-flag-group.dto';
import { FlagGroupQueryDto } from './dto/flag-group-query.dto';
import { FlagGroupResponseDto } from './dto/flag-group-response.dto';
import { UpdateFlagGroupConfigDto } from './dto/update-flag-group-config.dto';
import { UpdateFlagGroupDto } from './dto/update-flag-group.dto';

const GROUP_SORT_FIELDS = ['createdAt', 'updatedAt', 'key', 'name'] as const;

@Injectable()
export class FlagGroupsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly environmentsRepository: EnvironmentsRepository,
    private readonly flagGroupsRepository: FlagGroupsRepository,
    private readonly flagGroupConfigsRepository: FlagGroupConfigsRepository,
    private readonly featureFlagsRepository: FeatureFlagsRepository,
    private readonly transactionService: TransactionService,
    private readonly auditLogService: AuditLogService,
    private readonly requestContext: RequestContextService,
    private readonly cacheInvalidator: EvaluationCacheInvalidator,
  ) {}

  async list(projectKey: string, query: FlagGroupQueryDto) {
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const environment = query.environmentKey
      ? await this.environmentsRepository.findByProjectIdAndKey(
          project.id,
          query.environmentKey,
        )
      : await this.environmentsRepository.findDefaultByProjectId(project.id);

    if (!environment) {
      throw notFoundError(
        query.environmentKey
          ? `Environment "${query.environmentKey}" was not found in project "${projectKey}".`
          : `Default environment for project "${projectKey}" was not found.`,
      );
    }

    const where: Prisma.FlagGroupWhereInput = {
      projectId: project.id,
      ...(query.search
        ? {
            OR: [
              { key: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy = this.buildOrderBy(query);
    const [items, total] = await Promise.all([
      this.flagGroupsRepository.findMany(
        where,
        orderBy,
        query.limit,
        query.offset,
      ),
      this.flagGroupsRepository.count(where),
    ]);

    return createPageResponse(
      items.map((group) =>
        this.toGroupResponse(project.key, group, environment.key),
      ),
      query.limit,
      query.offset,
      total,
    );
  }

  async create(
    projectKey: string,
    body: CreateFlagGroupDto,
  ): Promise<FlagGroupResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const existing = await this.flagGroupsRepository.findByProjectIdAndKey(
      project.id,
      body.key,
    );

    if (existing) {
      throw conflictError(
        `Flag group "${body.key}" already exists in project "${projectKey}".`,
      );
    }

    const result = await this.transactionService.run(async (tx) => {
      const environments =
        await this.environmentsRepository.findManyByProjectId(project.id, tx);
      const environment = environments.find((item) => item.isDefault);

      if (!environment) {
        throw notFoundError(
          `Default environment for project "${projectKey}" was not found.`,
        );
      }

      const group = await this.flagGroupsRepository.create(
        {
          projectId: project.id,
          key: body.key,
          name: body.name,
        },
        tx,
      );

      const configs = [];

      for (const projectEnvironment of environments) {
        const config = await this.flagGroupConfigsRepository.create(
          {
            projectId: project.id,
            groupId: group.id,
            environmentId: projectEnvironment.id,
            killSwitch: false,
          },
          tx,
        );

        configs.push({
          ...config,
          environment: projectEnvironment,
        });
      }

      const defaultConfig = configs.find(
        (config) => config.environmentId === environment.id,
      );

      if (!defaultConfig) {
        throw new Error(
          `Flag group configuration was not created for default environment "${environment.key}".`,
        );
      }

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: environment.id,
        environmentKey: environment.key,
        targetType: AuditTargetType.FLAG_GROUP,
        targetId: group.id,
        targetKey: group.key,
        action: AuditAction.FLAG_GROUP_CREATED,
        actor,
        before: null,
        after: this.groupSnapshot(
          group,
          environment.key,
          defaultConfig.killSwitch,
        ),
        metadata: {
          source: 'api',
          initializedEnvironmentCount: configs.length,
        },
        requestId,
      });

      return {
        group: {
          ...group,
          configs,
          _count: { flags: 0 },
        },
        environment,
      };
    });

    return this.toGroupResponse(
      project.key,
      result.group,
      result.environment.key,
    );
  }

  async update(
    projectKey: string,
    groupKey: string,
    body: UpdateFlagGroupDto,
  ): Promise<FlagGroupResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const result = await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const existing =
        await this.flagGroupsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          groupKey,
          tx,
        );

      if (!existing) {
        throw notFoundError(
          `Flag group "${groupKey}" was not found in project "${projectKey}".`,
        );
      }

      const defaultEnvironment =
        await this.environmentsRepository.findDefaultByProjectId(
          project.id,
          tx,
        );

      if (!defaultEnvironment) {
        throw notFoundError(
          `Default environment for project "${projectKey}" was not found.`,
        );
      }

      if (existing.name === body.name) {
        return { project, group: existing, environment: defaultEnvironment };
      }

      await this.flagGroupsRepository.updateByProjectIdAndKey(
        project.id,
        groupKey,
        { name: body.name },
        tx,
      );
      const updated =
        await this.flagGroupsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          groupKey,
          tx,
        );

      if (!updated) {
        throw notFoundError(`Flag group "${groupKey}" was not found.`);
      }

      const beforeConfig = this.findGroupConfig(
        existing,
        defaultEnvironment.key,
      );
      const afterConfig = this.findGroupConfig(updated, defaultEnvironment.key);

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: defaultEnvironment.id,
        environmentKey: defaultEnvironment.key,
        targetType: AuditTargetType.FLAG_GROUP,
        targetId: existing.id,
        targetKey: existing.key,
        action: AuditAction.FLAG_GROUP_UPDATED,
        actor,
        before: this.groupSnapshot(
          existing,
          defaultEnvironment.key,
          beforeConfig?.killSwitch ?? false,
        ),
        after: this.groupSnapshot(
          updated,
          defaultEnvironment.key,
          afterConfig?.killSwitch ?? false,
        ),
        metadata: { source: 'api' },
        requestId,
      });

      return { project, group: updated, environment: defaultEnvironment };
    });

    return this.toGroupResponse(
      result.project.key,
      result.group,
      result.environment.key,
    );
  }

  async delete(projectKey: string, groupKey: string): Promise<void> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const existing =
        await this.flagGroupsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          groupKey,
          tx,
        );

      if (!existing) {
        throw notFoundError(
          `Flag group "${groupKey}" was not found in project "${projectKey}".`,
        );
      }

      if (existing._count.flags > 0) {
        throw conflictError(
          `Flag group "${groupKey}" cannot be deleted while ${existing._count.flags} flag(s) are assigned. Unassign all flags first.`,
        );
      }

      const defaultEnvironment =
        await this.environmentsRepository.findDefaultByProjectId(
          project.id,
          tx,
        );

      await this.flagGroupsRepository.deleteByProjectIdAndKey(
        project.id,
        groupKey,
        tx,
      );

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: defaultEnvironment?.id ?? null,
        environmentKey: defaultEnvironment?.key ?? null,
        targetType: AuditTargetType.FLAG_GROUP,
        targetId: existing.id,
        targetKey: existing.key,
        action: AuditAction.FLAG_GROUP_DELETED,
        actor,
        before: this.deletedGroupSnapshot(existing),
        after: null,
        metadata: {
          source: 'api',
          cascadedConfigCount: existing.configs.length,
        },
        requestId,
      });
    });
  }

  async updateConfig(
    projectKey: string,
    groupKey: string,
    body: UpdateFlagGroupConfigDto,
  ): Promise<FlagGroupResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();
    const killSwitch = body.killSwitch as boolean;

    const result = await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const environment =
        await this.environmentsRepository.findByProjectIdAndKey(
          project.id,
          body.environmentKey,
          tx,
        );

      if (!environment) {
        throw notFoundError(
          `Environment "${body.environmentKey}" was not found in project "${projectKey}".`,
        );
      }

      const group =
        await this.flagGroupsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          groupKey,
          tx,
        );

      if (!group) {
        throw notFoundError(
          `Flag group "${groupKey}" was not found in project "${projectKey}".`,
        );
      }

      const existingConfig = this.findGroupConfig(group, environment.key);

      if (existingConfig?.killSwitch === killSwitch) {
        return {
          project,
          group,
          environment,
          changed: false,
          affectedFlagKeys: [] as string[],
        };
      }

      await this.flagGroupConfigsRepository.upsertByGroupIdAndEnvironmentId(
        group.id,
        environment.id,
        {
          projectId: project.id,
          groupId: group.id,
          environmentId: environment.id,
          killSwitch,
        },
        {
          killSwitch,
        },
        tx,
      );

      const updated =
        await this.flagGroupsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          groupKey,
          tx,
        );

      if (!updated) {
        throw notFoundError(`Flag group "${groupKey}" was not found.`);
      }

      const affectedFlags = await this.featureFlagsRepository.findKeysByGroupId(
        group.id,
        tx,
      );

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: environment.id,
        environmentKey: environment.key,
        targetType: AuditTargetType.FLAG_GROUP,
        targetId: group.id,
        targetKey: group.key,
        action: AuditAction.FLAG_GROUP_KILL_SWITCH_UPDATED,
        actor,
        before: this.groupConfigSnapshot(
          group.key,
          environment.key,
          existingConfig?.killSwitch ?? false,
        ),
        after: this.groupConfigSnapshot(group.key, environment.key, killSwitch),
        metadata: {
          source: 'api',
          affectedFlagCount: affectedFlags.length,
        },
        requestId,
      });

      return {
        project,
        group: updated,
        environment,
        changed: true,
        affectedFlagKeys: affectedFlags.map((flag) => flag.key),
      };
    });

    if (result.changed && result.affectedFlagKeys.length > 0) {
      await this.cacheInvalidator.invalidateFlags(
        result.project.key,
        result.affectedFlagKeys,
        result.environment.key,
      );
    }

    return this.toGroupResponse(
      result.project.key,
      result.group,
      result.environment.key,
    );
  }

  async assignFlag(
    projectKey: string,
    flagKey: string,
    body: AssignFlagGroupDto,
  ): Promise<FeatureFlagResponseDto> {
    return this.changeFlagAssignment(
      projectKey,
      flagKey,
      body.groupKey,
      AuditAction.FEATURE_FLAG_GROUP_ASSIGNED,
    );
  }

  async unassignFlag(
    projectKey: string,
    flagKey: string,
  ): Promise<FeatureFlagResponseDto> {
    return this.changeFlagAssignment(
      projectKey,
      flagKey,
      null,
      AuditAction.FEATURE_FLAG_GROUP_UNASSIGNED,
    );
  }

  private async changeFlagAssignment(
    projectKey: string,
    flagKey: string,
    groupKey: string | null,
    action: AuditAction,
  ): Promise<FeatureFlagResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const result = await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const flag =
        await this.featureFlagsRepository.findByProjectIdAndKeyWithGroup(
          project.id,
          flagKey,
          tx,
        );

      if (!flag) {
        throw notFoundError(
          `Feature flag "${flagKey}" was not found in project "${projectKey}".`,
        );
      }

      const group = groupKey
        ? await this.flagGroupsRepository.findByProjectIdAndKey(
            project.id,
            groupKey,
            tx,
          )
        : null;

      if (groupKey && !group) {
        throw notFoundError(
          `Flag group "${groupKey}" was not found in project "${projectKey}".`,
        );
      }

      if (flag.groupId === (group?.id ?? null)) {
        const unchanged =
          await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
            project.id,
            flagKey,
            tx,
          );

        if (!unchanged) {
          throw notFoundError(`Feature flag "${flagKey}" was not found.`);
        }

        return { project, flag: unchanged, changed: false };
      }

      await this.featureFlagsRepository.updateGroupByProjectIdAndKey(
        project.id,
        flagKey,
        group?.id ?? null,
        tx,
      );

      const updated =
        await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          flagKey,
          tx,
        );

      if (!updated) {
        throw notFoundError(`Feature flag "${flagKey}" was not found.`);
      }

      const defaultConfig = updated.environmentConfigs.find(
        (config) => config.environment.isDefault,
      );

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: defaultConfig?.environmentId ?? null,
        environmentKey: defaultConfig?.environment.key ?? null,
        targetType: AuditTargetType.FEATURE_FLAG,
        targetId: flag.id,
        targetKey: flag.key,
        action,
        actor,
        before: this.assignmentSnapshot(flag.key, flag.group?.key ?? null),
        after: this.assignmentSnapshot(flag.key, group?.key ?? null),
        metadata: { source: 'api' },
        requestId,
      });

      return { project, flag: updated, changed: true };
    });

    if (result.changed) {
      await this.cacheInvalidator.invalidateFlag(
        result.project.key,
        result.flag.key,
      );
    }

    return this.toFeatureFlagResponse(result.project.key, result.flag);
  }

  private buildOrderBy(
    query: FlagGroupQueryDto,
  ): Prisma.FlagGroupOrderByWithRelationInput {
    const sort = query.sort ?? 'createdAt';

    if (
      !GROUP_SORT_FIELDS.includes(sort as (typeof GROUP_SORT_FIELDS)[number])
    ) {
      throw validationError('Unsupported flag group sort field.', [
        {
          field: 'sort',
          message: `Allowed values: ${GROUP_SORT_FIELDS.join(', ')}.`,
        },
      ]);
    }

    return {
      [sort]: query.order ?? 'desc',
    };
  }

  private getRequiredActor(): string {
    const actor = this.requestContext.getActor();

    if (!actor) {
      throw validationError(
        'Authenticated actor identity is required for mutation requests.',
        [
          {
            field: 'Authorization',
            message:
              'Provide valid demo credentials so configuration changes can be audited.',
          },
        ],
      );
    }

    return actor;
  }

  private findGroupConfig(
    group: {
      configs: Array<{
        killSwitch: boolean;
        environment: { key: string };
      }>;
    },
    environmentKey: string,
  ) {
    return group.configs.find(
      (config) => config.environment.key === environmentKey,
    );
  }

  private toGroupResponse(
    projectKey: string,
    group: {
      id: string;
      key: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      configs: Array<{
        killSwitch: boolean;
        environment: { key: string };
      }>;
      _count: { flags: number };
    },
    environmentKey: string,
  ): FlagGroupResponseDto {
    const config = this.findGroupConfig(group, environmentKey);

    return {
      id: group.id,
      projectKey,
      key: group.key,
      name: group.name,
      environmentKey,
      killSwitch: config?.killSwitch ?? false,
      assignedFlagCount: group._count.flags,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private groupSnapshot(
    group: { id: string; key: string; name: string },
    environmentKey: string,
    killSwitch: boolean,
  ) {
    return cleanAuditSnapshot({
      id: group.id,
      key: group.key,
      name: group.name,
      environmentKey,
      killSwitch,
    });
  }

  private groupConfigSnapshot(
    groupKey: string,
    environmentKey: string,
    killSwitch: boolean,
  ) {
    return cleanAuditSnapshot({
      groupKey,
      environmentKey,
      killSwitch,
    });
  }

  private deletedGroupSnapshot(group: {
    id: string;
    key: string;
    name: string;
    configs: Array<{
      killSwitch: boolean;
      environment: { key: string };
    }>;
    _count: { flags: number };
  }) {
    return cleanAuditSnapshot({
      id: group.id,
      key: group.key,
      name: group.name,
      assignedFlagCount: group._count.flags,
      configs: group.configs.map((config) => ({
        environmentKey: config.environment.key,
        killSwitch: config.killSwitch,
      })),
    });
  }

  private assignmentSnapshot(flagKey: string, groupKey: string | null) {
    return cleanAuditSnapshot({
      flagKey,
      groupKey,
    });
  }

  private toFeatureFlagResponse(
    projectKey: string,
    flag: {
      id: string;
      key: string;
      name: string;
      description: string | null;
      lifecycleStatus: FeatureFlagLifecycleStatus;
      archivedAt: Date | null;
      deletedAt?: Date | null;
      deletedBy?: string | null;
      createdAt: Date;
      updatedAt: Date;
      environmentConfigs: Array<{
        environmentId: string;
        status: FlagConfigStatus;
        servingMode: ServingMode;
        killSwitch: boolean;
        environment: { key: string; isDefault: boolean };
      }>;
      group: {
        key: string;
        name: string;
        configs: Array<{
          killSwitch: boolean;
          environment: { key: string };
        }>;
      } | null;
    },
  ): FeatureFlagResponseDto {
    const config =
      flag.environmentConfigs.find((item) => item.environment.isDefault) ??
      flag.environmentConfigs[0];
    const environmentKey = config?.environment.key ?? 'production';

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
      environmentKey,
      group: flag.group
        ? {
            key: flag.group.key,
            name: flag.group.name,
            killSwitch:
              flag.group.configs.find(
                (groupConfig) => groupConfig.environment.key === environmentKey,
              )?.killSwitch ?? false,
          }
        : null,
      archivedAt: flag.archivedAt,
      deletedAt: flag.deletedAt ?? null,
      deletedBy: flag.deletedBy ?? null,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    };
  }
}
