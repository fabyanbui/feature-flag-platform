import { Injectable } from '@nestjs/common';
import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { DEFAULT_ACTOR } from '../common/constants/api.constants';
import { createPageResponse } from '../common/dto/page-response.dto';
import {
  conflictError,
  notFoundError,
  validationError,
} from '../common/errors/api-exception.helpers';
import { cleanAuditSnapshot } from '../common/utils/audit-snapshot.util';
import { RequestContextService } from '../common/request-context/request-context.service';
import { TransactionService } from '../database/transaction.service';
import { EnvironmentsRepository } from '../repositories/environments.repository';
import { ProjectsRepository } from '../repositories/projects.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_SORT_FIELDS = ['createdAt', 'updatedAt', 'key', 'name'] as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly environmentsRepository: EnvironmentsRepository,
    private readonly transactionService: TransactionService,
    private readonly auditLogService: AuditLogService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: ProjectQueryDto) {
    const where: Prisma.ProjectWhereInput = query.search
      ? {
          OR: [
            {
              key: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const orderBy = this.buildOrderBy(query);

    const [items, total] = await Promise.all([
      this.projectsRepository.findMany(
        where,
        orderBy,
        query.limit,
        query.offset,
      ),
      this.projectsRepository.count(where),
    ]);

    return createPageResponse(
      items.map((project) => this.toResponse(project)),
      query.limit,
      query.offset,
      total,
    );
  }

  async get(projectKey: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findByKey(projectKey);

    if (!project) {
      throw notFoundError(`Project "${projectKey}" was not found.`);
    }

    return this.toResponse(project);
  }

  async create(body: CreateProjectDto): Promise<ProjectResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const existing = await this.projectsRepository.findByKey(body.key);

    if (existing) {
      throw conflictError(`Project "${body.key}" already exists.`);
    }

    const project = await this.transactionService.run(async (tx) => {
      const createdProject = await this.projectsRepository.create(
        {
          key: body.key,
          name: body.name,
          description: body.description ?? null,
        },
        tx,
      );

      const environment = await this.environmentsRepository.create(
        {
          projectId: createdProject.id,
          key: 'production',
          name: 'Production',
          description: 'Default production environment.',
          isDefault: true,
          sortOrder: 0,
        },
        tx,
      );

      await this.auditLogService.record(tx, {
        projectId: createdProject.id,
        projectKey: createdProject.key,
        environmentId: environment.id,
        environmentKey: environment.key,
        targetType: AuditTargetType.PROJECT,
        targetId: createdProject.id,
        targetKey: createdProject.key,
        action: AuditAction.PROJECT_CREATED,
        actor,
        before: null,
        after: this.projectSnapshot(createdProject),
        metadata: {
          source: 'api',
          defaultEnvironmentKey: environment.key,
        },
        requestId,
      });

      return createdProject;
    });

    return this.toResponse(project);
  }

  async update(
    projectKey: string,
    body: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const actor = this.getRequiredActor();
    const requestId = this.requestContext.getRequestId();

    const project = await this.transactionService.run(async (tx) => {
      const existing = await this.projectsRepository.findByKey(projectKey, tx);

      if (!existing) {
        throw notFoundError(`Project "${projectKey}" was not found.`);
      }

      const updated = await this.projectsRepository.updateByKey(
        projectKey,
        {
          name: body.name,
          description:
            body.description === undefined ? undefined : body.description,
        },
        tx,
      );

      await this.auditLogService.record(tx, {
        projectId: updated.id,
        projectKey: updated.key,
        targetType: AuditTargetType.PROJECT,
        targetId: updated.id,
        targetKey: updated.key,
        action: AuditAction.PROJECT_UPDATED,
        actor,
        before: this.projectSnapshot(existing),
        after: this.projectSnapshot(updated),
        metadata: {
          source: 'api',
        },
        requestId,
      });

      return updated;
    });

    return this.toResponse(project);
  }

  private buildOrderBy(
    query: ProjectQueryDto,
  ): Prisma.ProjectOrderByWithRelationInput {
    const sort = query.sort ?? 'createdAt';

    if (
      !PROJECT_SORT_FIELDS.includes(
        sort as (typeof PROJECT_SORT_FIELDS)[number],
      )
    ) {
      throw validationError('Unsupported project sort field.', [
        {
          field: 'sort',
          message: `Allowed values: ${PROJECT_SORT_FIELDS.join(', ')}.`,
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

    return actor || DEFAULT_ACTOR;
  }

  private projectSnapshot(project: {
    id: string;
    key: string;
    name: string;
    description: string | null;
  }) {
    return cleanAuditSnapshot({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
    });
  }

  private toResponse(project: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectResponseDto {
    return {
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
