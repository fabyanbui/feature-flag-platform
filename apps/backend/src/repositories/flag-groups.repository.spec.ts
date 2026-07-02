import { FlagGroupsRepository } from './flag-groups.repository';

describe('FlagGroupsRepository', () => {
  const prisma = {
    flagGroup: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  let repository: FlagGroupsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FlagGroupsRepository(prisma as never);
  });

  it('finds a group by its project-scoped key', async () => {
    prisma.flagGroup.findUnique.mockResolvedValue({ id: 'group-1' });

    await repository.findByProjectIdAndKey('project-1', 'checkout');

    expect(prisma.flagGroup.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_key: {
          projectId: 'project-1',
          key: 'checkout',
        },
      },
    });
  });

  it('loads environment configs and assigned flag count', async () => {
    prisma.flagGroup.findUnique.mockResolvedValue({ id: 'group-1' });

    await repository.findByProjectIdAndKeyWithConfigs('project-1', 'checkout');

    expect(prisma.flagGroup.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_key: {
          projectId: 'project-1',
          key: 'checkout',
        },
      },
      include: {
        configs: {
          include: {
            environment: true,
          },
        },
        _count: {
          select: {
            flags: true,
          },
        },
      },
    });
  });

  it('creates a group through the supplied repository client', async () => {
    const tx = {
      flagGroup: {
        create: jest.fn().mockResolvedValue({ id: 'group-1' }),
      },
    };
    const data = {
      projectId: 'project-1',
      key: 'checkout',
      name: 'Checkout flags',
    };

    await repository.create(data, tx as never);

    expect(tx.flagGroup.create).toHaveBeenCalledWith({ data });
    expect(prisma.flagGroup.create).not.toHaveBeenCalled();
  });

  it('updates a group by project-scoped immutable key', async () => {
    prisma.flagGroup.update.mockResolvedValue({ id: 'group-1' });

    await repository.updateByProjectIdAndKey('project-1', 'checkout', {
      name: 'Checkout experience',
    });

    expect(prisma.flagGroup.update).toHaveBeenCalledWith({
      where: {
        projectId_key: {
          projectId: 'project-1',
          key: 'checkout',
        },
      },
      data: {
        name: 'Checkout experience',
      },
    });
  });

  it('deletes a group by project-scoped immutable key', async () => {
    prisma.flagGroup.delete.mockResolvedValue({ id: 'group-1' });

    await repository.deleteByProjectIdAndKey('project-1', 'checkout');

    expect(prisma.flagGroup.delete).toHaveBeenCalledWith({
      where: {
        projectId_key: {
          projectId: 'project-1',
          key: 'checkout',
        },
      },
    });
  });

  it('lists groups with configs and assigned flag counts', async () => {
    prisma.flagGroup.findMany.mockResolvedValue([]);
    const where = { projectId: 'project-1' };
    const orderBy = { createdAt: 'desc' as const };

    await repository.findMany(where, orderBy, 20, 10);

    expect(prisma.flagGroup.findMany).toHaveBeenCalledWith({
      where,
      orderBy,
      take: 20,
      skip: 10,
      include: {
        configs: {
          include: {
            environment: true,
          },
        },
        _count: {
          select: {
            flags: true,
          },
        },
      },
    });
  });

  it('counts groups using the supplied filter', async () => {
    prisma.flagGroup.count.mockResolvedValue(2);
    const where = { projectId: 'project-1' };

    await repository.count(where);

    expect(prisma.flagGroup.count).toHaveBeenCalledWith({ where });
  });
});
