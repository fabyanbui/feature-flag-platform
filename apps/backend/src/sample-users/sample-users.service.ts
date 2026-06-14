import { Injectable } from '@nestjs/common';
import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';
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
import { ProjectsRepository } from '../repositories/projects.repository';
import { SampleUsersRepository } from '../repositories/sample-users.repository';
import { CreateSampleUserDto } from './dto/create-sample-user.dto';
import { SampleUserQueryDto } from './dto/sample-user-query.dto';
import { SampleUserResponseDto } from './dto/sample-user-response.dto';

const SAMPLE_USER_SORT_FIELDS = [
  'createdAt',
  'displayName',
  'targetingKey',
] as const;

interface NormalizedSampleUserInput {
  displayName: string;
  targetingKey: string;
  userId: string | null;
  roles: string[];
  attributes?: Record<string, unknown>;
}

@Injectable()
export class SampleUsersService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly sampleUsersRepository: SampleUsersRepository,
    private readonly transactionService: TransactionService,
    private readonly auditLogService: AuditLogService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(projectKey: string, query: SampleUserQueryDto) {
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const roleFilter = query.role?.trim();

    const where: Prisma.SampleUserContextWhereInput = {
      projectId: project.id,
      ...(query.search
        ? {
            OR: [
              {
                displayName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                targetingKey: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                userId: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(roleFilter
        ? {
            roles: {
              array_contains: roleFilter,
            },
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(query);

    const [items, total] = await Promise.all([
      this.sampleUsersRepository.findMany(
        where,
        orderBy,
        query.limit,
        query.offset,
      ),
      this.sampleUsersRepository.count(where),
    ]);

    return createPageResponse(
      items.map((sampleUser) => this.toResponse(project.key, sampleUser)),
      query.limit,
      query.offset,
      total,
    );
  }

  async create(
    projectKey: string,
    body: CreateSampleUserDto,
  ): Promise<SampleUserResponseDto> {
    const normalized = this.normalizeSampleUserInput(body);

    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    const existing =
      await this.sampleUsersRepository.findByProjectIdAndTargetingKey(
        project.id,
        normalized.targetingKey,
      );

    if (existing) {
      throw conflictError(
        `Sample user "${normalized.targetingKey}" already exists in project "${projectKey}".`,
      );
    }

    const created = await this.transactionService.run(async (tx) => {
      const sampleUser = await this.sampleUsersRepository.create(
        {
          project: {
            connect: {
              id: project.id,
            },
          },
          displayName: normalized.displayName,
          targetingKey: normalized.targetingKey,
          userId: normalized.userId,
          roles: normalized.roles,
          attributes: this.toInputJsonObject(normalized.attributes),
        },
        tx,
      );

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        targetType: AuditTargetType.SAMPLE_USER,
        targetId: sampleUser.id,
        targetKey: sampleUser.targetingKey,
        action: AuditAction.SAMPLE_USER_CREATED,
        actor,
        before: null,
        after: this.sampleUserSnapshot(sampleUser),
        metadata: {
          source: 'api',
        },
        requestId,
      });

      return sampleUser;
    });

    return this.toResponse(project.key, created);
  }

  async delete(projectKey: string, targetingKey: string): Promise<void> {
    const normalizedTargetingKey = this.normalizeTargetingKey(targetingKey);
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    await this.transactionService.run(async (tx) => {
      const project = await this.projectsRepository.findByKey(projectKey, tx);

      if (!project) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const existing =
        await this.sampleUsersRepository.findByProjectIdAndTargetingKey(
          project.id,
          normalizedTargetingKey,
          tx,
        );

      if (!existing) {
        throw notFoundError(
          `Sample user "${normalizedTargetingKey}" was not found in project "${projectKey}".`,
        );
      }

      await this.sampleUsersRepository.deleteByProjectIdAndTargetingKey(
        project.id,
        normalizedTargetingKey,
        tx,
      );

      await this.auditLogService.record(tx, {
        projectId: project.id,
        projectKey: project.key,
        targetType: AuditTargetType.SAMPLE_USER,
        targetId: existing.id,
        targetKey: existing.targetingKey,
        action: AuditAction.SAMPLE_USER_DELETED,
        actor,
        before: this.sampleUserSnapshot(existing),
        after: null,
        metadata: {
          source: 'api',
        },
        requestId,
      });
    });
  }

  private normalizeSampleUserInput(
    body: CreateSampleUserDto,
  ): NormalizedSampleUserInput {
    const displayName = body.displayName.trim();

    if (!displayName) {
      throw validationError('Sample user displayName is required.', [
        {
          field: 'displayName',
          message: 'displayName must not be empty or whitespace only.',
        },
      ]);
    }

    const targetingKey = this.normalizeTargetingKey(body.targetingKey);
    const userId = body.userId?.trim();

    if (body.userId !== undefined && !userId) {
      throw validationError('Invalid sample user userId.', [
        {
          field: 'userId',
          message:
            'userId must not be whitespace only when provided. Use a synthetic non-PII identifier.',
        },
      ]);
    }

    return {
      displayName,
      targetingKey,
      userId: userId || null,
      roles: this.normalizeRoles(body.roles),
      attributes: body.attributes,
    };
  }

  private normalizeTargetingKey(value: string): string {
    const targetingKey = value.trim();

    if (!targetingKey) {
      throw validationError('Sample user targetingKey is required.', [
        {
          field: 'targetingKey',
          message:
            'targetingKey must be a stable non-empty non-PII identifier.',
        },
      ]);
    }

    return targetingKey;
  }

  private normalizeRoles(roles: string[] | undefined): string[] {
    return [
      ...new Set((roles ?? []).map((role) => role.trim()).filter(Boolean)),
    ];
  }

  private buildOrderBy(
    query: SampleUserQueryDto,
  ): Prisma.SampleUserContextOrderByWithRelationInput {
    const sort = query.sort ?? 'createdAt';

    if (
      !SAMPLE_USER_SORT_FIELDS.includes(
        sort as (typeof SAMPLE_USER_SORT_FIELDS)[number],
      )
    ) {
      throw validationError('Unsupported sample user sort field.', [
        {
          field: 'sort',
          message: `Allowed values: ${SAMPLE_USER_SORT_FIELDS.join(', ')}.`,
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

  private sampleUserSnapshot(sampleUser: {
    id: string;
    displayName: string;
    targetingKey: string;
    userId: string | null;
    roles: Prisma.JsonValue;
    attributes: Prisma.JsonValue;
  }) {
    return cleanAuditSnapshot({
      id: sampleUser.id,
      displayName: sampleUser.displayName,
      targetingKey: sampleUser.targetingKey,
      userId: sampleUser.userId,
      roles: sampleUser.roles,
      attributes: sampleUser.attributes,
    });
  }

  private toResponse(
    projectKey: string,
    sampleUser: {
      id: string;
      displayName: string;
      targetingKey: string;
      userId: string | null;
      roles: Prisma.JsonValue;
      attributes: Prisma.JsonValue;
      createdAt: Date;
      updatedAt: Date;
    },
  ): SampleUserResponseDto {
    return {
      id: sampleUser.id,
      projectKey,
      displayName: sampleUser.displayName,
      targetingKey: sampleUser.targetingKey,
      userId: sampleUser.userId,
      roles: this.toStringArray(sampleUser.roles),
      attributes: this.toRecord(sampleUser.attributes),
      createdAt: sampleUser.createdAt,
      updatedAt: sampleUser.updatedAt,
    };
  }

  private toStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private toInputJsonObject(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonObject {
    return (value ?? {}) as Prisma.InputJsonObject;
  }

  private toRecord(value: Prisma.JsonValue): Record<string, unknown> {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {};
    }

    return value;
  }
}
