import {
  AuditAction,
  AuditTargetType,
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';
import { ApiErrorCode } from '../common/errors/api-error-code';
import { FlagGroupsService } from './flag-groups.service';

const fixedDate = new Date('2026-06-24T00:00:00.000Z');

function createProject() {
  return {
    id: 'project-1',
    key: 'demo-project',
    name: 'Demo Project',
    description: null,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };
}

function createEnvironment(overrides = {}) {
  return {
    id: 'environment-1',
    projectId: 'project-1',
    key: 'production',
    name: 'Production',
    description: null,
    isDefault: true,
    sortOrder: 0,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

function createGroup(overrides = {}) {
  return {
    id: 'group-1',
    projectId: 'project-1',
    key: 'checkout',
    name: 'Checkout flags',
    createdAt: fixedDate,
    updatedAt: fixedDate,
    configs: [
      {
        id: 'group-config-1',
        projectId: 'project-1',
        groupId: 'group-1',
        environmentId: 'environment-1',
        killSwitch: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        environment: createEnvironment(),
      },
    ],
    _count: {
      flags: 2,
    },
    ...overrides,
  };
}

function createFlag(overrides = {}) {
  return {
    id: 'flag-1',
    projectId: 'project-1',
    groupId: null,
    key: 'new-checkout',
    name: 'New Checkout',
    description: null,
    lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    archivedAt: null,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    group: null,
    environmentConfigs: [
      {
        id: 'flag-config-1',
        projectId: 'project-1',
        flagId: 'flag-1',
        environmentId: 'environment-1',
        status: FlagConfigStatus.ENABLED,
        servingMode: ServingMode.GLOBAL_ON,
        killSwitch: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        environment: createEnvironment(),
        rules: [],
      },
    ],
    ...overrides,
  };
}

describe('FlagGroupsService', () => {
  const tx = { kind: 'transaction-client' } as never;
  const projectsRepository = {
    findByKey: jest.fn(),
  };
  const environmentsRepository = {
    findDefaultByProjectId: jest.fn(),
    findByProjectIdAndKey: jest.fn(),
    findManyByProjectId: jest.fn(),
  };
  const flagGroupsRepository = {
    findByProjectIdAndKey: jest.fn(),
    findByProjectIdAndKeyWithConfigs: jest.fn(),
    create: jest.fn(),
    updateByProjectIdAndKey: jest.fn(),
    deleteByProjectIdAndKey: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const flagGroupConfigsRepository = {
    create: jest.fn(),
    upsertByGroupIdAndEnvironmentId: jest.fn(),
  };
  const featureFlagsRepository = {
    findByProjectIdAndKeyWithGroup: jest.fn(),
    updateGroupByProjectIdAndKey: jest.fn(),
    findByProjectIdAndKeyWithConfigs: jest.fn(),
    findKeysByGroupId: jest.fn(),
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
  const cacheInvalidator = {
    invalidateFlag: jest.fn(),
    invalidateFlags: jest.fn(),
  };

  let service: FlagGroupsService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionService.run.mockImplementation(async (callback) => callback(tx));
    requestContext.getActor.mockReturnValue('mentor@example.local');
    requestContext.getRequestId.mockReturnValue('req-phase-12');
    featureFlagsRepository.findKeysByGroupId.mockResolvedValue([]);
    cacheInvalidator.invalidateFlag.mockResolvedValue(undefined);
    cacheInvalidator.invalidateFlags.mockResolvedValue(undefined);

    service = new FlagGroupsService(
      projectsRepository as never,
      environmentsRepository as never,
      flagGroupsRepository as never,
      flagGroupConfigsRepository as never,
      featureFlagsRepository as never,
      transactionService as never,
      auditLogService,
      requestContext as never,
      cacheInvalidator as never,
    );
  });

  it('lists groups for the default environment with pagination', async () => {
    projectsRepository.findByKey.mockResolvedValue(createProject());
    environmentsRepository.findDefaultByProjectId.mockResolvedValue(
      createEnvironment(),
    );
    flagGroupsRepository.findMany.mockResolvedValue([createGroup()]);
    flagGroupsRepository.count.mockResolvedValue(1);

    const result = await service.list('demo-project', {
      search: 'check',
      limit: 20,
      offset: 0,
      sort: 'key',
      order: 'asc',
    });

    expect(flagGroupsRepository.findMany).toHaveBeenCalledWith(
      {
        projectId: 'project-1',
        OR: [
          {
            key: {
              contains: 'check',
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: 'check',
              mode: 'insensitive',
            },
          },
        ],
      },
      { key: 'asc' },
      20,
      0,
    );
    expect(result.items[0]).toMatchObject({
      projectKey: 'demo-project',
      key: 'checkout',
      environmentKey: 'production',
      killSwitch: false,
      assignedFlagCount: 2,
    });
  });

  it('rejects unsupported group sort fields', async () => {
    projectsRepository.findByKey.mockResolvedValue(createProject());
    environmentsRepository.findDefaultByProjectId.mockResolvedValue(
      createEnvironment(),
    );

    await expect(
      service.list('demo-project', {
        limit: 20,
        offset: 0,
        sort: 'assignedFlagCount',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.VALIDATION_ERROR,
      }),
    });
  });

  it('creates inactive configs for every environment with one audit entry', async () => {
    const project = createProject();
    const environment = createEnvironment();
    const staging = createEnvironment({
      id: 'environment-2',
      key: 'staging',
      name: 'Staging',
      isDefault: false,
      sortOrder: 1,
    });
    const group = createGroup({ configs: [], _count: undefined });
    const config = createGroup().configs[0];
    const stagingConfig = {
      ...config,
      id: 'group-config-2',
      environmentId: staging.id,
    };

    projectsRepository.findByKey.mockResolvedValue(project);
    flagGroupsRepository.findByProjectIdAndKey.mockResolvedValue(null);
    environmentsRepository.findManyByProjectId.mockResolvedValue([
      environment,
      staging,
    ]);
    flagGroupsRepository.create.mockResolvedValue(group);
    flagGroupConfigsRepository.create
      .mockResolvedValueOnce(config)
      .mockResolvedValueOnce(stagingConfig);

    const result = await service.create('demo-project', {
      key: 'checkout',
      name: 'Checkout flags',
    });

    expect(flagGroupsRepository.create).toHaveBeenCalledWith(
      {
        projectId: 'project-1',
        key: 'checkout',
        name: 'Checkout flags',
      },
      tx,
    );
    expect(flagGroupConfigsRepository.create).toHaveBeenNthCalledWith(
      1,
      {
        projectId: 'project-1',
        groupId: 'group-1',
        environmentId: 'environment-1',
        killSwitch: false,
      },
      tx,
    );
    expect(flagGroupConfigsRepository.create).toHaveBeenNthCalledWith(
      2,
      {
        projectId: 'project-1',
        groupId: 'group-1',
        environmentId: 'environment-2',
        killSwitch: false,
      },
      tx,
    );
    expect(auditLogService.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        targetType: AuditTargetType.FLAG_GROUP,
        action: AuditAction.FLAG_GROUP_CREATED,
        actor: 'mentor@example.local',
        before: null,
        after: expect.objectContaining({
          key: 'checkout',
          environmentKey: 'production',
          killSwitch: false,
        }),
        metadata: {
          source: 'api',
          initializedEnvironmentCount: 2,
        },
        requestId: 'req-phase-12',
      }),
    );
    expect(result).toMatchObject({
      key: 'checkout',
      killSwitch: false,
      assignedFlagCount: 0,
    });
  });

  it('rejects a duplicate group key', async () => {
    projectsRepository.findByKey.mockResolvedValue(createProject());
    flagGroupsRepository.findByProjectIdAndKey.mockResolvedValue(createGroup());

    await expect(
      service.create('demo-project', {
        key: 'checkout',
        name: 'Checkout flags',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.CONFLICT,
      }),
    });

    expect(transactionService.run).not.toHaveBeenCalled();
  });

  it('renames a group and audits before and after snapshots', async () => {
    const existing = createGroup();
    const updated = createGroup({ name: 'Checkout experience' });

    projectsRepository.findByKey.mockResolvedValue(createProject());
    environmentsRepository.findDefaultByProjectId.mockResolvedValue(
      createEnvironment(),
    );
    flagGroupsRepository.findByProjectIdAndKeyWithConfigs
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    flagGroupsRepository.updateByProjectIdAndKey.mockResolvedValue(updated);

    const result = await service.update('demo-project', 'checkout', {
      name: 'Checkout experience',
    });

    expect(flagGroupsRepository.updateByProjectIdAndKey).toHaveBeenCalledWith(
      'project-1',
      'checkout',
      { name: 'Checkout experience' },
      tx,
    );
    expect(auditLogService.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditAction.FLAG_GROUP_UPDATED,
        before: expect.objectContaining({ name: 'Checkout flags' }),
        after: expect.objectContaining({ name: 'Checkout experience' }),
      }),
    );
    expect(result.name).toBe('Checkout experience');
  });

  it('does not audit an idempotent rename', async () => {
    projectsRepository.findByKey.mockResolvedValue(createProject());
    environmentsRepository.findDefaultByProjectId.mockResolvedValue(
      createEnvironment(),
    );
    flagGroupsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      createGroup(),
    );

    await service.update('demo-project', 'checkout', {
      name: 'Checkout flags',
    });

    expect(flagGroupsRepository.updateByProjectIdAndKey).not.toHaveBeenCalled();
    expect(auditLogService.record).not.toHaveBeenCalled();
  });

  it('deletes an unassigned group and audits the cascaded configs', async () => {
    const group = createGroup({
      _count: { flags: 0 },
      configs: [
        createGroup().configs[0],
        {
          ...createGroup().configs[0],
          id: 'group-config-2',
          environmentId: 'environment-2',
          killSwitch: true,
          environment: createEnvironment({
            id: 'environment-2',
            key: 'staging',
            name: 'Staging',
            isDefault: false,
          }),
        },
      ],
    });

    projectsRepository.findByKey.mockResolvedValue(createProject());
    flagGroupsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      group,
    );
    environmentsRepository.findDefaultByProjectId.mockResolvedValue(
      createEnvironment(),
    );
    flagGroupsRepository.deleteByProjectIdAndKey.mockResolvedValue(group);

    await service.delete('demo-project', 'checkout');

    expect(flagGroupsRepository.deleteByProjectIdAndKey).toHaveBeenCalledWith(
      'project-1',
      'checkout',
      tx,
    );
    expect(auditLogService.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        targetType: AuditTargetType.FLAG_GROUP,
        action: AuditAction.FLAG_GROUP_DELETED,
        targetKey: 'checkout',
        before: {
          id: 'group-1',
          key: 'checkout',
          name: 'Checkout flags',
          assignedFlagCount: 0,
          configs: [
            {
              environmentKey: 'production',
              killSwitch: false,
            },
            {
              environmentKey: 'staging',
              killSwitch: true,
            },
          ],
        },
        after: null,
        metadata: {
          source: 'api',
          cascadedConfigCount: 2,
        },
      }),
    );
  });

  it('rejects deleting a group with assigned flags', async () => {
    projectsRepository.findByKey.mockResolvedValue(createProject());
    flagGroupsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      createGroup({ _count: { flags: 2 } }),
    );

    await expect(
      service.delete('demo-project', 'checkout'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.CONFLICT,
      }),
    });

    expect(flagGroupsRepository.deleteByProjectIdAndKey).not.toHaveBeenCalled();
    expect(auditLogService.record).not.toHaveBeenCalled();
  });

  it('activates the group switch and writes one group audit entry', async () => {
    const existing = createGroup();
    const updated = createGroup({
      configs: [
        {
          ...createGroup().configs[0],
          killSwitch: true,
        },
      ],
    });

    projectsRepository.findByKey.mockResolvedValue(createProject());
    environmentsRepository.findByProjectIdAndKey.mockResolvedValue(
      createEnvironment(),
    );
    flagGroupsRepository.findByProjectIdAndKeyWithConfigs
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    featureFlagsRepository.findKeysByGroupId.mockResolvedValue([
      { id: 'flag-1', key: 'new-checkout' },
      { id: 'flag-2', key: 'recommendations' },
    ]);

    const result = await service.updateConfig('demo-project', 'checkout', {
      environmentKey: 'production',
      killSwitch: true,
    });

    expect(
      flagGroupConfigsRepository.upsertByGroupIdAndEnvironmentId,
    ).toHaveBeenCalledWith(
      'group-1',
      'environment-1',
      expect.objectContaining({
        projectId: 'project-1',
        killSwitch: true,
      }),
      { killSwitch: true },
      tx,
    );
    expect(auditLogService.record).toHaveBeenCalledTimes(1);
    expect(featureFlagsRepository.findKeysByGroupId).toHaveBeenCalledWith(
      'group-1',
      tx,
    );
    expect(auditLogService.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        targetType: AuditTargetType.FLAG_GROUP,
        action: AuditAction.FLAG_GROUP_KILL_SWITCH_UPDATED,
        before: {
          groupKey: 'checkout',
          environmentKey: 'production',
          killSwitch: false,
        },
        after: {
          groupKey: 'checkout',
          environmentKey: 'production',
          killSwitch: true,
        },
        metadata: {
          source: 'api',
          affectedFlagCount: 2,
        },
      }),
    );
    expect(cacheInvalidator.invalidateFlags).toHaveBeenCalledWith(
      'demo-project',
      ['new-checkout', 'recommendations'],
      'production',
    );
    expect(transactionService.run.mock.invocationCallOrder[0]).toBeLessThan(
      cacheInvalidator.invalidateFlags.mock.invocationCallOrder[0],
    );
    expect(result.killSwitch).toBe(true);
  });

  it('does not invalidate an idempotent group switch update', async () => {
    projectsRepository.findByKey.mockResolvedValue(createProject());
    environmentsRepository.findByProjectIdAndKey.mockResolvedValue(
      createEnvironment(),
    );
    flagGroupsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      createGroup(),
    );

    await service.updateConfig('demo-project', 'checkout', {
      environmentKey: 'production',
      killSwitch: false,
    });

    expect(
      flagGroupConfigsRepository.upsertByGroupIdAndEnvironmentId,
    ).not.toHaveBeenCalled();
    expect(featureFlagsRepository.findKeysByGroupId).not.toHaveBeenCalled();
    expect(auditLogService.record).not.toHaveBeenCalled();
    expect(cacheInvalidator.invalidateFlags).not.toHaveBeenCalled();
  });

  it('does not invalidate when a group switch affects no flags', async () => {
    const existing = createGroup({ _count: { flags: 0 } });
    const updated = createGroup({
      _count: { flags: 0 },
      configs: [
        {
          ...createGroup().configs[0],
          killSwitch: true,
        },
      ],
    });

    projectsRepository.findByKey.mockResolvedValue(createProject());
    environmentsRepository.findByProjectIdAndKey.mockResolvedValue(
      createEnvironment(),
    );
    flagGroupsRepository.findByProjectIdAndKeyWithConfigs
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);
    featureFlagsRepository.findKeysByGroupId.mockResolvedValue([]);

    await service.updateConfig('demo-project', 'checkout', {
      environmentKey: 'production',
      killSwitch: true,
    });

    expect(auditLogService.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        metadata: {
          source: 'api',
          affectedFlagCount: 0,
        },
      }),
    );
    expect(cacheInvalidator.invalidateFlags).not.toHaveBeenCalled();
  });

  it('assigns a flag and audits the feature flag mutation', async () => {
    const group = createGroup();
    const beforeFlag = createFlag();
    const afterFlag = createFlag({
      groupId: 'group-1',
      group,
    });

    projectsRepository.findByKey.mockResolvedValue(createProject());
    featureFlagsRepository.findByProjectIdAndKeyWithGroup.mockResolvedValue(
      beforeFlag,
    );
    flagGroupsRepository.findByProjectIdAndKey.mockResolvedValue(group);
    featureFlagsRepository.updateGroupByProjectIdAndKey.mockResolvedValue(
      afterFlag,
    );
    featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      afterFlag,
    );

    const result = await service.assignFlag('demo-project', 'new-checkout', {
      groupKey: 'checkout',
    });

    expect(
      featureFlagsRepository.updateGroupByProjectIdAndKey,
    ).toHaveBeenCalledWith('project-1', 'new-checkout', 'group-1', tx);
    expect(auditLogService.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        targetType: AuditTargetType.FEATURE_FLAG,
        action: AuditAction.FEATURE_FLAG_GROUP_ASSIGNED,
        before: {
          flagKey: 'new-checkout',
          groupKey: null,
        },
        after: {
          flagKey: 'new-checkout',
          groupKey: 'checkout',
        },
      }),
    );
    expect(cacheInvalidator.invalidateFlag).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
    );
    expect(transactionService.run.mock.invocationCallOrder[0]).toBeLessThan(
      cacheInvalidator.invalidateFlag.mock.invocationCallOrder[0],
    );
    expect(result.group).toEqual({
      key: 'checkout',
      name: 'Checkout flags',
      killSwitch: false,
    });
  });

  it('does not write another audit entry for the same assignment', async () => {
    const group = createGroup();
    const assignedFlag = createFlag({
      groupId: 'group-1',
      group,
    });

    projectsRepository.findByKey.mockResolvedValue(createProject());
    featureFlagsRepository.findByProjectIdAndKeyWithGroup.mockResolvedValue(
      assignedFlag,
    );
    flagGroupsRepository.findByProjectIdAndKey.mockResolvedValue(group);
    featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      assignedFlag,
    );

    await service.assignFlag('demo-project', 'new-checkout', {
      groupKey: 'checkout',
    });

    expect(
      featureFlagsRepository.updateGroupByProjectIdAndKey,
    ).not.toHaveBeenCalled();
    expect(auditLogService.record).not.toHaveBeenCalled();
    expect(cacheInvalidator.invalidateFlag).not.toHaveBeenCalled();
  });

  it('invalidates all environments when reassigning a flag', async () => {
    const previousGroup = createGroup({
      id: 'old-group',
      key: 'old-checkout',
    });
    const nextGroup = createGroup({
      id: 'new-group',
      key: 'new-checkout-group',
    });
    const beforeFlag = createFlag({
      groupId: 'old-group',
      group: previousGroup,
    });
    const afterFlag = createFlag({
      groupId: 'new-group',
      group: nextGroup,
    });

    projectsRepository.findByKey.mockResolvedValue(createProject());
    featureFlagsRepository.findByProjectIdAndKeyWithGroup.mockResolvedValue(
      beforeFlag,
    );
    flagGroupsRepository.findByProjectIdAndKey.mockResolvedValue(nextGroup);
    featureFlagsRepository.updateGroupByProjectIdAndKey.mockResolvedValue(
      afterFlag,
    );
    featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      afterFlag,
    );

    await service.assignFlag('demo-project', 'new-checkout', {
      groupKey: 'new-checkout-group',
    });

    expect(cacheInvalidator.invalidateFlag).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
    );
  });

  it('unassigns a flag and records the previous group', async () => {
    const group = createGroup();
    const beforeFlag = createFlag({
      groupId: 'group-1',
      group,
    });
    const afterFlag = createFlag();

    projectsRepository.findByKey.mockResolvedValue(createProject());
    featureFlagsRepository.findByProjectIdAndKeyWithGroup.mockResolvedValue(
      beforeFlag,
    );
    featureFlagsRepository.updateGroupByProjectIdAndKey.mockResolvedValue(
      afterFlag,
    );
    featureFlagsRepository.findByProjectIdAndKeyWithConfigs.mockResolvedValue(
      afterFlag,
    );

    const result = await service.unassignFlag('demo-project', 'new-checkout');

    expect(auditLogService.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditAction.FEATURE_FLAG_GROUP_UNASSIGNED,
        before: {
          flagKey: 'new-checkout',
          groupKey: 'checkout',
        },
        after: {
          flagKey: 'new-checkout',
          groupKey: null,
        },
      }),
    );
    expect(cacheInvalidator.invalidateFlag).toHaveBeenCalledWith(
      'demo-project',
      'new-checkout',
    );
    expect(result.group).toBeNull();
  });

  it('does not invalidate when a group mutation transaction fails', async () => {
    transactionService.run.mockRejectedValue(new Error('transaction failed'));

    await expect(
      service.updateConfig('demo-project', 'checkout', {
        environmentKey: 'production',
        killSwitch: true,
      }),
    ).rejects.toThrow('transaction failed');

    expect(cacheInvalidator.invalidateFlags).not.toHaveBeenCalled();
    expect(cacheInvalidator.invalidateFlag).not.toHaveBeenCalled();
  });

  it('requires an actor before any mutation transaction', async () => {
    requestContext.getActor.mockReturnValue(undefined);

    await expect(
      service.create('demo-project', {
        key: 'checkout',
        name: 'Checkout flags',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ApiErrorCode.VALIDATION_ERROR,
      }),
    });

    expect(transactionService.run).not.toHaveBeenCalled();
  });
});
