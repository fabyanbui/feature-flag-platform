import { AuditAction, AuditTargetType } from '@prisma/client';
import { ApiErrorCode } from '../common/errors/api-error-code';
import { ProjectsService } from './projects.service';

const fixedDate = new Date('2026-06-01T00:00:00.000Z');

function createProject(overrides = {}) {
  return {
    id: 'project-1',
    key: 'demo-project',
    name: 'Demo Project',
    description: 'Demo project description.',
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

function createEnvironment(overrides = {}) {
  return {
    id: 'environment-1',
    projectId: 'project-1',
    key: 'production',
    name: 'Production',
    description: 'Default production environment.',
    isDefault: true,
    sortOrder: 0,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

describe('ProjectsService', () => {
  const tx = {
    kind: 'transaction-client',
  } as never;

  const projectsRepository = {
    findByKey: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    updateByKey: jest.fn(),
  };

  const environmentsRepository = {
    create: jest.fn(),
  };

  const transactionService = {
    run: jest.fn(),
  };

  const auditLogService = {
    record: jest.fn(),
  };

  const requestContext = {
    getActor: jest.fn(),
    getRequestId: jest.fn(),
  };

  let service: ProjectsService;

  beforeEach(() => {
    jest.resetAllMocks();

    transactionService.run.mockImplementation(
      async (callback: (tx: never) => Promise<unknown>) => callback(tx),
    );

    requestContext.getActor.mockReturnValue('mentor@example.local');
    requestContext.getRequestId.mockReturnValue('req-test');

    service = new ProjectsService(
      projectsRepository as never,
      environmentsRepository as never,
      transactionService as never,
      auditLogService,
      requestContext as never,
    );
  });

  describe('list', () => {
    it('builds search filter across key and name', async () => {
      const project = createProject();

      projectsRepository.findMany.mockResolvedValue([project]);
      projectsRepository.count.mockResolvedValue(1);

      const result = await service.list({
        search: 'demo',
        limit: 20,
        offset: 0,
        sort: 'name',
        order: 'asc',
      });

      const expectedWhere = {
        OR: [
          {
            key: {
              contains: 'demo',
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: 'demo',
              mode: 'insensitive',
            },
          },
        ],
      };

      expect(projectsRepository.findMany).toHaveBeenCalledWith(
        expectedWhere,
        {
          name: 'asc',
        },
        20,
        0,
      );

      expect(projectsRepository.count).toHaveBeenCalledWith(expectedWhere);

      expect(result).toEqual({
        items: [
          {
            id: 'project-1',
            key: 'demo-project',
            name: 'Demo Project',
            description: 'Demo project description.',
            createdAt: fixedDate,
            updatedAt: fixedDate,
          },
        ],
        page: {
          limit: 20,
          offset: 0,
          total: 1,
          hasNext: false,
        },
      });
    });

    it('returns page response with hasNext=true when more projects exist', async () => {
      projectsRepository.findMany.mockResolvedValue([createProject()]);
      projectsRepository.count.mockResolvedValue(25);

      const result = await service.list({
        limit: 20,
        offset: 0,
        order: 'desc',
      });

      expect(projectsRepository.findMany).toHaveBeenCalledWith(
        {},
        {
          createdAt: 'desc',
        },
        20,
        0,
      );

      expect(result.page).toEqual({
        limit: 20,
        offset: 0,
        total: 25,
        hasNext: true,
      });
    });

    it('rejects unsupported sort field', async () => {
      await expect(
        service.list({
          limit: 20,
          offset: 0,
          sort: 'unsupported',
          order: 'desc',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.VALIDATION_ERROR,
        }),
      });

      expect(projectsRepository.findMany).not.toHaveBeenCalled();
      expect(projectsRepository.count).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('returns project response when project exists', async () => {
      const project = createProject();

      projectsRepository.findByKey.mockResolvedValue(project);

      await expect(service.get('demo-project')).resolves.toEqual({
        id: 'project-1',
        key: 'demo-project',
        name: 'Demo Project',
        description: 'Demo project description.',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      });

      expect(projectsRepository.findByKey).toHaveBeenCalledWith('demo-project');
    });

    it('throws NOT_FOUND when project does not exist', async () => {
      projectsRepository.findByKey.mockResolvedValue(null);

      await expect(service.get('missing-project')).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });
    });
  });

  describe('create', () => {
    it('rejects missing actor before mutation', async () => {
      requestContext.getActor.mockReturnValue(undefined);

      await expect(
        service.create({
          key: 'demo-project',
          name: 'Demo Project',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.VALIDATION_ERROR,
        }),
      });

      expect(projectsRepository.findByKey).not.toHaveBeenCalled();
      expect(transactionService.run).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('rejects duplicate project key with CONFLICT', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());

      await expect(
        service.create({
          key: 'demo-project',
          name: 'Demo Project',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.CONFLICT,
        }),
      });

      expect(projectsRepository.findByKey).toHaveBeenCalledWith('demo-project');
      expect(transactionService.run).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('creates project and default production environment in one transaction', async () => {
      const project = createProject();
      const environment = createEnvironment();

      projectsRepository.findByKey.mockResolvedValue(null);
      projectsRepository.create.mockResolvedValue(project);
      environmentsRepository.create.mockResolvedValue(environment);

      const result = await service.create({
        key: 'demo-project',
        name: 'Demo Project',
        description: 'Demo project description.',
      });

      expect(transactionService.run).toHaveBeenCalledTimes(1);

      expect(projectsRepository.create).toHaveBeenCalledWith(
        {
          key: 'demo-project',
          name: 'Demo Project',
          description: 'Demo project description.',
        },
        tx,
      );

      expect(environmentsRepository.create).toHaveBeenCalledWith(
        {
          projectId: 'project-1',
          key: 'production',
          name: 'Production',
          description: 'Default production environment.',
          isDefault: true,
          sortOrder: 0,
        },
        tx,
      );

      expect(result).toEqual({
        id: 'project-1',
        key: 'demo-project',
        name: 'Demo Project',
        description: 'Demo project description.',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      });
    });

    it('writes PROJECT_CREATED audit entry in the same transaction', async () => {
      const project = createProject();
      const environment = createEnvironment();

      projectsRepository.findByKey.mockResolvedValue(null);
      projectsRepository.create.mockResolvedValue(project);
      environmentsRepository.create.mockResolvedValue(environment);

      await service.create({
        key: 'demo-project',
        name: 'Demo Project',
        description: 'Demo project description.',
      });

      expect(auditLogService.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          projectId: 'project-1',
          projectKey: 'demo-project',
          environmentId: 'environment-1',
          environmentKey: 'production',
          targetType: AuditTargetType.PROJECT,
          targetId: 'project-1',
          targetKey: 'demo-project',
          action: AuditAction.PROJECT_CREATED,
          actor: 'mentor@example.local',
          before: null,
          after: {
            id: 'project-1',
            key: 'demo-project',
            name: 'Demo Project',
            description: 'Demo project description.',
          },
          metadata: {
            source: 'api',
            defaultEnvironmentKey: 'production',
          },
          requestId: 'req-test',
        }),
      );
    });
  });

  describe('update', () => {
    it('rejects missing actor before mutation', async () => {
      requestContext.getActor.mockReturnValue(undefined);

      await expect(
        service.update('demo-project', {
          name: 'Updated Project',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.VALIDATION_ERROR,
        }),
      });

      expect(transactionService.run).not.toHaveBeenCalled();
      expect(projectsRepository.updateByKey).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when project does not exist inside transaction', async () => {
      projectsRepository.findByKey.mockResolvedValue(null);

      await expect(
        service.update('missing-project', {
          name: 'Updated Project',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(transactionService.run).toHaveBeenCalledTimes(1);
      expect(projectsRepository.findByKey).toHaveBeenCalledWith(
        'missing-project',
        tx,
      );
      expect(projectsRepository.updateByKey).not.toHaveBeenCalled();
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('updates mutable fields inside transaction', async () => {
      const existing = createProject({
        name: 'Old Project',
        description: 'Old description.',
      });

      const updated = createProject({
        name: 'Updated Project',
        description: 'Updated description.',
      });

      projectsRepository.findByKey.mockResolvedValue(existing);
      projectsRepository.updateByKey.mockResolvedValue(updated);

      const result = await service.update('demo-project', {
        name: 'Updated Project',
        description: 'Updated description.',
      });

      expect(projectsRepository.findByKey).toHaveBeenCalledWith(
        'demo-project',
        tx,
      );

      expect(projectsRepository.updateByKey).toHaveBeenCalledWith(
        'demo-project',
        {
          name: 'Updated Project',
          description: 'Updated description.',
        },
        tx,
      );

      expect(result).toEqual({
        id: 'project-1',
        key: 'demo-project',
        name: 'Updated Project',
        description: 'Updated description.',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      });
    });

    it('passes undefined description through as undefined so existing description can be preserved', async () => {
      const existing = createProject({
        name: 'Old Project',
        description: 'Old description.',
      });

      const updated = createProject({
        name: 'Updated Project',
        description: 'Old description.',
      });

      projectsRepository.findByKey.mockResolvedValue(existing);
      projectsRepository.updateByKey.mockResolvedValue(updated);

      await service.update('demo-project', {
        name: 'Updated Project',
      });

      expect(projectsRepository.updateByKey).toHaveBeenCalledWith(
        'demo-project',
        {
          name: 'Updated Project',
          description: undefined,
        },
        tx,
      );
    });

    it('writes PROJECT_UPDATED audit entry with before and after snapshots in the same transaction', async () => {
      const existing = createProject({
        name: 'Old Project',
        description: 'Old description.',
      });

      const updated = createProject({
        name: 'Updated Project',
        description: 'Updated description.',
      });

      projectsRepository.findByKey.mockResolvedValue(existing);
      projectsRepository.updateByKey.mockResolvedValue(updated);

      await service.update('demo-project', {
        name: 'Updated Project',
        description: 'Updated description.',
      });

      expect(auditLogService.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          projectId: 'project-1',
          projectKey: 'demo-project',
          targetType: AuditTargetType.PROJECT,
          targetId: 'project-1',
          targetKey: 'demo-project',
          action: AuditAction.PROJECT_UPDATED,
          actor: 'mentor@example.local',
          before: {
            id: 'project-1',
            key: 'demo-project',
            name: 'Old Project',
            description: 'Old description.',
          },
          after: {
            id: 'project-1',
            key: 'demo-project',
            name: 'Updated Project',
            description: 'Updated description.',
          },
          metadata: {
            source: 'api',
          },
          requestId: 'req-test',
        }),
      );
    });
  });
});
