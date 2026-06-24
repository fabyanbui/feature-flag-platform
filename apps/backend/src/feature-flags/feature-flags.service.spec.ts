import {
  AuditAction,
  AuditTargetType,
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';
import { ApiErrorCode } from '../common/errors/api-error-code';
import { FeatureFlagsService } from './feature-flags.service';

const fixedDate = new Date('2026-06-01T00:00:00.000Z');

function createProject(overrides = {}) {
  return {
    id: 'project-1',
    key: 'demo-project',
    name: 'Demo Project',
    description: null,
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

function createConfig(overrides = {}) {
  return {
    id: 'config-1',
    projectId: 'project-1',
    flagId: 'flag-1',
    environmentId: 'environment-1',
    status: FlagConfigStatus.DISABLED,
    servingMode: ServingMode.TARGETED,
    killSwitch: false,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    environment: createEnvironment(),
    ...overrides,
  };
}

function createFlag(overrides = {}) {
  return {
    id: 'flag-1',
    projectId: 'project-1',
    key: 'new-checkout',
    name: 'New Checkout',
    description: 'Controls checkout rollout.',
    lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    archivedAt: null,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    environmentConfigs: [createConfig()],
    ...overrides,
  };
}

describe('FeatureFlagsService', () => {
  const tx = {
    kind: 'transaction-client',
  } as never;

  const projectsRepository = {
    findByKey: jest.fn(),
  };

  const environmentsRepository = {
    findDefaultByProjectId: jest.fn(),
  };

  const featureFlagsRepository = {
    findMany: jest.fn(),
    count: jest.fn(),
    findByProjectIdAndKey: jest.fn(),
    findByProjectIdAndKeyWithConfigs: jest.fn(),
    create: jest.fn(),
    updateByProjectIdAndKey: jest.fn(),
  };

  const flagConfigsRepository = {
    create: jest.fn(),
    updateById: jest.fn(),
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

  let service: FeatureFlagsService;

  beforeEach(() => {
    jest.clearAllMocks();

    transactionService.run.mockImplementation(async (callback) => callback(tx));
    requestContext.getActor.mockReturnValue('mentor@example.local');
    requestContext.getRequestId.mockReturnValue('req-test');

    service = new FeatureFlagsService(
      projectsRepository as never,
      environmentsRepository as never,
      featureFlagsRepository as never,
      flagConfigsRepository as never,
      transactionService as never,
      auditLogService,
      requestContext as never,
    );
  });

  describe('list', () => {
    it('throws NOT_FOUND when project is missing', async () => {
      projectsRepository.findByKey.mockResolvedValue(null);

      await expect(
        service.list('missing-project', {
          limit: 20,
          offset: 0,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });

      expect(featureFlagsRepository.findMany).not.toHaveBeenCalled();
    });

    it('builds filters and returns page response', async () => {
      const flag = createFlag();

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findMany.mockResolvedValue([flag]);
      featureFlagsRepository.count.mockResolvedValue(1);

      const result = await service.list('demo-project', {
        search: 'checkout',
        status: FlagConfigStatus.DISABLED,
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
        limit: 20,
        offset: 0,
        sort: 'key',
        order: 'asc',
      });

      const expectedWhere = {
        projectId: 'project-1',
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
        OR: [
          {
            key: {
              contains: 'checkout',
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: 'checkout',
              mode: 'insensitive',
            },
          },
        ],
        environmentConfigs: {
          some: {
            status: FlagConfigStatus.DISABLED,
          },
        },
      };

      expect(featureFlagsRepository.findMany).toHaveBeenCalledWith(
        expectedWhere,
        {
          key: 'asc',
        },
        20,
        0,
      );
      expect(featureFlagsRepository.count).toHaveBeenCalledWith(expectedWhere);

      expect(result).toEqual({
        items: [
          {
            id: 'flag-1',
            projectKey: 'demo-project',
            key: 'new-checkout',
            name: 'New Checkout',
            description: 'Controls checkout rollout.',
            lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
            status: FlagConfigStatus.DISABLED,
            servingMode: ServingMode.TARGETED,
            killSwitch: false,
            environmentKey: 'production',
            group: null,
            archivedAt: null,
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

    it('rejects unsupported sort field', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());

      await expect(
        service.list('demo-project', {
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

      expect(featureFlagsRepository.findMany).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('returns feature flag response', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        createFlag(),
      );

      await expect(
        service.get('demo-project', 'new-checkout'),
      ).resolves.toEqual({
        id: 'flag-1',
        projectKey: 'demo-project',
        key: 'new-checkout',
        name: 'New Checkout',
        description: 'Controls checkout rollout.',
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
        status: FlagConfigStatus.DISABLED,
        servingMode: ServingMode.TARGETED,
        killSwitch: false,
        environmentKey: 'production',
        group: null,
        archivedAt: null,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      });
    });

    it('throws NOT_FOUND when flag is missing', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
        null,
      );

      await expect(
        service.get('demo-project', 'missing-flag'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.NOT_FOUND,
        }),
      });
    });
  });

  describe('create', () => {
    it('requires actor before mutation', async () => {
      requestContext.getActor.mockReturnValue(undefined);

      await expect(
        service.create('demo-project', {
          key: 'new-checkout',
          name: 'New Checkout',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.VALIDATION_ERROR,
        }),
      });

      expect(transactionService.run).not.toHaveBeenCalled();
    });

    it('rejects duplicate flag key with CONFLICT', async () => {
      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKey.mockResolvedValue(
        createFlag(),
      );

      await expect(
        service.create('demo-project', {
          key: 'new-checkout',
          name: 'New Checkout',
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ApiErrorCode.CONFLICT,
        }),
      });

      expect(transactionService.run).not.toHaveBeenCalled();
    });

    it('creates flag with safe default config and writes audit log in same transaction', async () => {
      const project = createProject();
      const environment = createEnvironment();
      const flag = createFlag({
        environmentConfigs: [],
      });
      const config = createConfig({
        environment,
      });

      projectsRepository.findByKey.mockResolvedValue(project);
      featureFlagsRepository.findByProjectIdAndKey.mockResolvedValue(null);
      environmentsRepository.findDefaultByProjectId.mockResolvedValue(
        environment,
      );
      featureFlagsRepository.create.mockResolvedValue(flag);
      flagConfigsRepository.create.mockResolvedValue(config);

      const result = await service.create('demo-project', {
        key: 'new-checkout',
        name: 'New Checkout',
        description: 'Controls checkout rollout.',
      });

      expect(featureFlagsRepository.create).toHaveBeenCalledWith(
        {
          project: {
            connect: {
              id: 'project-1',
            },
          },
          key: 'new-checkout',
          name: 'New Checkout',
          description: 'Controls checkout rollout.',
        },
        tx,
      );

      expect(flagConfigsRepository.create).toHaveBeenCalledWith(
        {
          projectId: 'project-1',
          flagId: 'flag-1',
          environmentId: 'environment-1',
          status: FlagConfigStatus.DISABLED,
          servingMode: ServingMode.TARGETED,
          killSwitch: false,
        },
        tx,
      );

      expect(auditLogService.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          projectId: 'project-1',
          projectKey: 'demo-project',
          environmentId: 'environment-1',
          environmentKey: 'production',
          targetType: AuditTargetType.FEATURE_FLAG,
          targetId: 'flag-1',
          targetKey: 'new-checkout',
          action: AuditAction.FEATURE_FLAG_CREATED,
          actor: 'mentor@example.local',
          before: null,
          after: expect.objectContaining({
            projectKey: 'demo-project',
            key: 'new-checkout',
            lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
            status: FlagConfigStatus.DISABLED,
            servingMode: ServingMode.TARGETED,
            killSwitch: false,
            environmentKey: 'production',
          }),
          requestId: 'req-test',
        }),
      );

      expect(result.status).toBe(FlagConfigStatus.DISABLED);
      expect(result.servingMode).toBe(ServingMode.TARGETED);
      expect(result.killSwitch).toBe(false);
    });
  });

  describe('update', () => {
    it('updates metadata/config and writes FEATURE_FLAG_UPDATED audit log', async () => {
      const existingFlag = createFlag({
        name: 'Old Checkout',
        description: 'Old description.',
      });

      const updatedFlagRecord = createFlag({
        name: 'Updated Checkout',
        description: 'Updated description.',
      });

      const afterFlag = createFlag({
        name: 'Updated Checkout',
        description: 'Updated description.',
        environmentConfigs: [
          createConfig({
            status: FlagConfigStatus.ENABLED,
            servingMode: ServingMode.GLOBAL_ON,
            killSwitch: true,
          }),
        ],
      });

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs
        .mockResolvedValueOnce(existingFlag)
        .mockResolvedValueOnce(afterFlag);
      featureFlagsRepository.updateByProjectIdAndKey.mockResolvedValue(
        updatedFlagRecord,
      );
      flagConfigsRepository.updateById.mockResolvedValue(
        afterFlag.environmentConfigs[0],
      );

      const result = await service.update('demo-project', 'new-checkout', {
        name: 'Updated Checkout',
        description: 'Updated description.',
        status: FlagConfigStatus.ENABLED,
        servingMode: ServingMode.GLOBAL_ON,
        killSwitch: true,
      });

      expect(
        featureFlagsRepository.updateByProjectIdAndKey,
      ).toHaveBeenCalledWith(
        'project-1',
        'new-checkout',
        {
          name: 'Updated Checkout',
          description: 'Updated description.',
        },
        tx,
      );

      expect(flagConfigsRepository.updateById).toHaveBeenCalledWith(
        'config-1',
        {
          status: FlagConfigStatus.ENABLED,
          servingMode: ServingMode.GLOBAL_ON,
          killSwitch: true,
        },
        tx,
      );

      expect(auditLogService.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          action: AuditAction.FEATURE_FLAG_UPDATED,
          targetType: AuditTargetType.FEATURE_FLAG,
          actor: 'mentor@example.local',
          before: expect.objectContaining({
            name: 'Old Checkout',
            status: FlagConfigStatus.DISABLED,
          }),
          after: expect.objectContaining({
            name: 'Updated Checkout',
            status: FlagConfigStatus.ENABLED,
            servingMode: ServingMode.GLOBAL_ON,
            killSwitch: true,
          }),
        }),
      );

      expect(result.lifecycleStatus).toBe(FeatureFlagLifecycleStatus.ACTIVE);
      expect(result.status).toBe(FlagConfigStatus.ENABLED);
    });
  });

  describe('archive and restore', () => {
    it('archives flag and writes FEATURE_FLAG_ARCHIVED audit log', async () => {
      const existingFlag = createFlag();
      const archivedRecord = createFlag({
        lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
        archivedAt: fixedDate,
      });
      const afterFlag = createFlag({
        lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
        archivedAt: fixedDate,
      });

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs
        .mockResolvedValueOnce(existingFlag)
        .mockResolvedValueOnce(afterFlag);
      featureFlagsRepository.updateByProjectIdAndKey.mockResolvedValue(
        archivedRecord,
      );

      const result = await service.archive('demo-project', 'new-checkout');

      expect(
        featureFlagsRepository.updateByProjectIdAndKey,
      ).toHaveBeenCalledWith(
        'project-1',
        'new-checkout',
        {
          lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
          archivedAt: expect.any(Date),
        },
        tx,
      );

      expect(auditLogService.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          action: AuditAction.FEATURE_FLAG_ARCHIVED,
          before: expect.objectContaining({
            lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
          }),
          after: expect.objectContaining({
            lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
          }),
        }),
      );

      expect(result.lifecycleStatus).toBe(FeatureFlagLifecycleStatus.ARCHIVED);
      expect(result.archivedAt).toBe(fixedDate);
    });

    it('restores flag and writes FEATURE_FLAG_RESTORED audit log', async () => {
      const existingFlag = createFlag({
        lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
        archivedAt: fixedDate,
      });
      const restoredRecord = createFlag({
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
        archivedAt: null,
      });
      const afterFlag = createFlag({
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
        archivedAt: null,
      });

      projectsRepository.findByKey.mockResolvedValue(createProject());
      featureFlagsRepository.findByProjectIdAndKeyWithConfigs
        .mockResolvedValueOnce(existingFlag)
        .mockResolvedValueOnce(afterFlag);
      featureFlagsRepository.updateByProjectIdAndKey.mockResolvedValue(
        restoredRecord,
      );

      const result = await service.restore('demo-project', 'new-checkout');

      expect(
        featureFlagsRepository.updateByProjectIdAndKey,
      ).toHaveBeenCalledWith(
        'project-1',
        'new-checkout',
        {
          lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
          archivedAt: null,
        },
        tx,
      );

      expect(auditLogService.record).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          action: AuditAction.FEATURE_FLAG_RESTORED,
          before: expect.objectContaining({
            lifecycleStatus: FeatureFlagLifecycleStatus.ARCHIVED,
          }),
          after: expect.objectContaining({
            lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
            archivedAt: null,
          }),
        }),
      );

      expect(result.lifecycleStatus).toBe(FeatureFlagLifecycleStatus.ACTIVE);
      expect(result.archivedAt).toBeNull();
    });
  });
});
