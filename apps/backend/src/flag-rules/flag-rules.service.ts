import { Injectable } from '@nestjs/common';
import {
  AuditAction,
  AuditTargetType,
  FlagConfigStatus,
  Prisma,
  RuleType,
  ServingMode,
} from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { createPageResponse } from '../common/dto/page-response.dto';
import {
  notFoundError,
  validationError,
} from '../common/errors/api-exception.helpers';
import { RequestContextService } from '../common/request-context/request-context.service';
import { cleanAuditSnapshot } from '../common/utils/audit-snapshot.util';
import { TransactionService } from '../database/transaction.service';
import { EvaluationCacheInvalidator } from '../evaluation/cache/evaluation-cache-invalidator';
import { isValidRolloutPercentage } from '../evaluation/engine/stable-rollout-hash';
import { FeatureFlagsRepository } from '../repositories/feature-flags.repository';
import { FlagRulesRepository } from '../repositories/flag-rules.repository';
import { ProjectsRepository } from '../repositories/projects.repository';
import { ReplaceRulesDto, RuleInputDto } from './dto/replace-rules.dto';
import { RuleQueryDto } from './dto/rule-query.dto';
import { RuleResponseDto } from './dto/rule-response.dto';

const RULE_SORT_FIELDS = ['priority', 'createdAt', 'type'] as const;

@Injectable()
export class FlagRulesService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly featureFlagsRepository: FeatureFlagsRepository,
    private readonly flagRulesRepository: FlagRulesRepository,
    private readonly transactionService: TransactionService,
    private readonly auditLogService: AuditLogService,
    private readonly requestContext: RequestContextService,
    private readonly cacheInvalidator: EvaluationCacheInvalidator,
  ) {}

  async list(projectKey: string, flagKey: string, query: RuleQueryDto) {
    const { config } = await this.getProjectFlagAndDefaultConfig(
      projectKey,
      flagKey,
    );

    const where: Prisma.FlagRuleWhereInput = {
      flagConfigId: config.id,
      type: query.type,
    };

    const orderBy = this.buildOrderBy(query);

    const [items, total] = await Promise.all([
      this.flagRulesRepository.findMany(
        where,
        orderBy,
        query.limit,
        query.offset,
      ),
      this.flagRulesRepository.count(where),
    ]);

    return createPageResponse(
      items.map((rule) => this.toResponse(rule)),
      query.limit,
      query.offset,
      total,
    );
  }

  async replace(
    projectKey: string,
    flagKey: string,
    body: ReplaceRulesDto,
  ): Promise<RuleResponseDto[]> {
    this.validateRules(body.rules);

    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const result = await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const flag =
        await this.featureFlagsRepository.findByProjectIdAndKeyWithConfigs(
          project.id,
          flagKey,
          tx,
        );

      if (!flag) {
        throw notFoundError(
          `Feature flag "${flagKey}" was not found in project "${projectKey}".`,
        );
      }

      const config = this.getDefaultConfig(flag);

      const before = await this.flagRulesRepository.findByConfigId(
        config.id,
        tx,
      );

      await this.flagRulesRepository.deleteByConfigId(config.id, tx);

      if (body.rules.length > 0) {
        await this.flagRulesRepository.createMany(
          body.rules.map((rule) => ({
            flagConfigId: config.id,
            type: rule.type,
            priority: rule.priority,
            enabled: rule.enabled,
            parameters: rule.parameters as Prisma.InputJsonValue,
          })),
          tx,
        );
      }

      const after = await this.flagRulesRepository.findByConfigId(
        config.id,
        tx,
      );

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        environmentId: config.environmentId,
        environmentKey: config.environment.key,
        targetType: AuditTargetType.FEATURE_FLAG,
        targetId: flag.id,
        targetKey: flag.key,
        action: AuditAction.FLAG_RULES_REPLACED,
        actor,
        before: this.rulesSnapshot(before),
        after: this.rulesSnapshot(after),
        metadata: {
          source: 'api',
          replacedRuleCount: after.length,
        },
        requestId,
      });

      return {
        projectKey: project.key,
        flagKey: flag.key,
        rules: after,
      };
    });

    await this.cacheInvalidator.invalidateFlag(
      result.projectKey,
      result.flagKey,
    );

    return result.rules.map((rule) => this.toResponse(rule));
  }

  private validateRules(rules: RuleInputDto[]) {
    const seenPriorities = new Set<number>();

    for (const rule of rules) {
      if (seenPriorities.has(rule.priority)) {
        throw validationError('Rule priorities must be unique.', [
          {
            field: 'rules.priority',
            message: `Duplicate priority value: ${rule.priority}.`,
          },
        ]);
      }

      seenPriorities.add(rule.priority);

      switch (rule.type) {
        case RuleType.USER_ALLOWLIST:
          this.validateStringArrayParameter(
            rule.parameters.userIds,
            'rules.parameters.userIds',
          );
          break;

        case RuleType.ROLE_TARGETING:
          this.validateStringArrayParameter(
            rule.parameters.roles,
            'rules.parameters.roles',
          );
          break;

        case RuleType.PERCENTAGE_ROLLOUT:
          if (!isValidRolloutPercentage(rule.parameters.percentage)) {
            throw validationError('Invalid percentage rollout rule.', [
              {
                field: 'rules.parameters.percentage',
                message:
                  'percentage must be a number from 0 to 100 with at most 2 decimal places.',
              },
            ]);
          }
          break;

        default:
          throw validationError('Unsupported rule type.', [
            {
              field: 'rules.type',
              message: `Unsupported rule type: ${String(rule.type)}.`,
            },
          ]);
      }
    }
  }

  private validateStringArrayParameter(value: unknown, field: string) {
    const isValid =
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => typeof item === 'string' && item.trim().length > 0);

    if (!isValid) {
      throw validationError('Invalid rule parameters.', [
        {
          field,
          message: 'Expected a non-empty array of non-empty strings.',
        },
      ]);
    }
  }

  private async getProjectFlagAndDefaultConfig(
    projectKey: string,
    flagKey: string,
  ) {
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

    return {
      project,
      flag,
      config: this.getDefaultConfig(flag),
    };
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
    query: RuleQueryDto,
  ): Prisma.FlagRuleOrderByWithRelationInput {
    const sort = query.sort ?? 'priority';

    if (!RULE_SORT_FIELDS.includes(sort as (typeof RULE_SORT_FIELDS)[number])) {
      throw validationError('Unsupported rule sort field.', [
        {
          field: 'sort',
          message: `Allowed values: ${RULE_SORT_FIELDS.join(', ')}.`,
        },
      ]);
    }

    return {
      [sort]: query.order ?? 'asc',
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

  private rulesSnapshot(
    rules: Array<{
      id: string;
      type: RuleType;
      priority: number;
      enabled: boolean;
      parameters: Prisma.JsonValue;
    }>,
  ) {
    return cleanAuditSnapshot({
      rules: rules.map((rule) => ({
        id: rule.id,
        type: rule.type,
        priority: rule.priority,
        enabled: rule.enabled,
        parameters: rule.parameters,
      })),
    });
  }

  private toResponse(rule: {
    id: string;
    type: RuleType;
    priority: number;
    enabled: boolean;
    parameters: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }): RuleResponseDto {
    return {
      id: rule.id,
      type: rule.type,
      priority: rule.priority,
      enabled: rule.enabled,
      parameters: rule.parameters,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}
