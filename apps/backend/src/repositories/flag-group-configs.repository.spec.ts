import { FlagGroupConfigsRepository } from './flag-group-configs.repository';

describe('FlagGroupConfigsRepository', () => {
  const prisma = {
    flagGroupConfig: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  let repository: FlagGroupConfigsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FlagGroupConfigsRepository(prisma as never);
  });

  it('finds a config by group and environment', async () => {
    prisma.flagGroupConfig.findUnique.mockResolvedValue({ id: 'config-1' });

    await repository.findByGroupIdAndEnvironmentId('group-1', 'environment-1');

    expect(prisma.flagGroupConfig.findUnique).toHaveBeenCalledWith({
      where: {
        groupId_environmentId: {
          groupId: 'group-1',
          environmentId: 'environment-1',
        },
      },
    });
  });

  it('creates a config through the supplied repository client', async () => {
    const tx = {
      flagGroupConfig: {
        create: jest.fn().mockResolvedValue({ id: 'config-1' }),
      },
    };
    const data = {
      projectId: 'project-1',
      groupId: 'group-1',
      environmentId: 'environment-1',
      killSwitch: false,
    };

    await repository.create(data, tx as never);

    expect(tx.flagGroupConfig.create).toHaveBeenCalledWith({ data });
    expect(prisma.flagGroupConfig.create).not.toHaveBeenCalled();
  });

  it('upserts one config per group and environment', async () => {
    prisma.flagGroupConfig.upsert.mockResolvedValue({ id: 'config-1' });
    const create = {
      projectId: 'project-1',
      groupId: 'group-1',
      environmentId: 'environment-1',
      killSwitch: true,
    };
    const update = {
      killSwitch: true,
    };

    await repository.upsertByGroupIdAndEnvironmentId(
      'group-1',
      'environment-1',
      create,
      update,
    );

    expect(prisma.flagGroupConfig.upsert).toHaveBeenCalledWith({
      where: {
        groupId_environmentId: {
          groupId: 'group-1',
          environmentId: 'environment-1',
        },
      },
      create,
      update,
    });
  });

  it('updates a config by immutable ID', async () => {
    prisma.flagGroupConfig.update.mockResolvedValue({ id: 'config-1' });

    await repository.updateById('config-1', {
      killSwitch: true,
    });

    expect(prisma.flagGroupConfig.update).toHaveBeenCalledWith({
      where: {
        id: 'config-1',
      },
      data: {
        killSwitch: true,
      },
    });
  });
});
