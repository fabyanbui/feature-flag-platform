import { EnvironmentsRepository } from './environments.repository';

describe('EnvironmentsRepository', () => {
  const prisma = {
    environment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let repository: EnvironmentsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new EnvironmentsRepository(prisma as never);
  });

  it('lists project environments in deterministic order', async () => {
    prisma.environment.findMany.mockResolvedValue([]);

    await repository.findManyByProjectId('project-1');

    expect(prisma.environment.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 'project-1',
      },
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    });
  });
});
