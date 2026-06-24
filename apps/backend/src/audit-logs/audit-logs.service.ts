import { Injectable } from '@nestjs/common';
import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';
import { createPageResponse } from '../common/dto/page-response.dto';
import {
  notFoundError,
  validationError,
} from '../common/errors/api-exception.helpers';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import { ProjectsRepository } from '../repositories/projects.repository';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

const AUDIT_LOG_SORT_FIELDS = [
  'createdAt',
  'actor',
  'targetType',
  'action',
] as const;

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async list(projectKey: string, query: AuditLogQueryDto) {
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    this.validateTimeRange(query);

    const where: Prisma.AuditLogEntryWhereInput = {
      projectId: project.id,
      targetType: query.targetType,
      targetKey: query.targetKey,
      actor: query.actor,
      action: query.action,
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(query);

    const [items, total] = await Promise.all([
      this.auditLogsRepository.findMany(
        where,
        orderBy,
        query.limit,
        query.offset,
      ),
      this.auditLogsRepository.count(where),
    ]);

    return createPageResponse(
      items.map((entry) => this.toResponse(entry)),
      query.limit,
      query.offset,
      total,
    );
  }

  private validateTimeRange(query: AuditLogQueryDto) {
    if (!query.from || !query.to) {
      return;
    }

    const from = new Date(query.from);
    const to = new Date(query.to);

    if (from > to) {
      throw validationError('Invalid audit log time range.', [
        {
          field: 'from',
          message: 'from must be earlier than or equal to to.',
        },
      ]);
    }
  }

  private buildOrderBy(
    query: AuditLogQueryDto,
  ): Prisma.AuditLogEntryOrderByWithRelationInput {
    const sort = query.sort ?? 'createdAt';

    if (
      !AUDIT_LOG_SORT_FIELDS.includes(
        sort as (typeof AUDIT_LOG_SORT_FIELDS)[number],
      )
    ) {
      throw validationError('Unsupported audit log sort field.', [
        {
          field: 'sort',
          message: `Allowed values: ${AUDIT_LOG_SORT_FIELDS.join(', ')}.`,
        },
      ]);
    }

    return {
      [sort]: query.order ?? 'desc',
    };
  }

  private toResponse(entry: {
    id: string;
    projectKey: string;
    environmentKey: string | null;
    targetType: AuditTargetType;
    targetId: string;
    targetKey: string | null;
    action: AuditAction;
    actor: string;
    before: Prisma.JsonValue | null;
    after: Prisma.JsonValue | null;
    metadata: Prisma.JsonValue | null;
    requestId: string;
    createdAt: Date;
  }): AuditLogResponseDto {
    return {
      id: entry.id,
      projectKey: entry.projectKey,
      environmentKey: entry.environmentKey,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetKey: entry.targetKey,
      action: entry.action,
      actor: entry.actor,
      before: entry.before,
      after: entry.after,
      metadata: entry.metadata,
      requestId: entry.requestId,
      createdAt: entry.createdAt,
    };
  }
}
