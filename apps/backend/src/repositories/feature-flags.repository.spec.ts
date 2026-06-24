import { FeatureFlagsRepository } from './feature-flags.repository';

describe('FeatureFlagsRepository group membership', () => {
  const prisma = {
    featureFlag: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let repository: FeatureFlagsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FeatureFlagsRepository(prisma as never);
  });

  it('loads the currently assigned group', async () => {
    prisma.featureFlag.findUnique.mockResolvedValue({ id: 'flag-1' });

    await repository.findByProjectIdAndKeyWithGroup(
      'project-1',
      'new-checkout',
    );

    expect(prisma.featureFlag.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_key: {
          projectId: 'project-1',
          key: 'new-checkout',
        },
      },
      include: {
        group: true,
      },
    });
  });

  it('assigns a group using the project-scoped flag key', async () => {
    prisma.featureFlag.update.mockResolvedValue({ id: 'flag-1' });

    await repository.updateGroupByProjectIdAndKey(
      'project-1',
      'new-checkout',
      'group-1',
    );

    expect(prisma.featureFlag.update).toHaveBeenCalledWith({
      where: {
        projectId_key: {
          projectId: 'project-1',
          key: 'new-checkout',
        },
      },
      data: {
        groupId: 'group-1',
      },
      include: {
        group: true,
      },
    });
  });

  it('unassigns a group by setting groupId to null', async () => {
    prisma.featureFlag.update.mockResolvedValue({ id: 'flag-1' });

    await repository.updateGroupByProjectIdAndKey(
      'project-1',
      'new-checkout',
      null,
    );

    expect(prisma.featureFlag.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          groupId: null,
        },
      }),
    );
  });

  it('lists stable flag identifiers for future group invalidation', async () => {
    prisma.featureFlag.findMany.mockResolvedValue([]);

    await repository.findKeysByGroupId('group-1');

    expect(prisma.featureFlag.findMany).toHaveBeenCalledWith({
      where: {
        groupId: 'group-1',
      },
      select: {
        id: true,
        key: true,
      },
      orderBy: {
        key: 'asc',
      },
    });
  });
});
