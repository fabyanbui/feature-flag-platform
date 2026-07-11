import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class FeatureFlagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProjectIdAndKey(
    projectId: string,
    flagKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.findFirst({
      where: {
        projectId,
        key: flagKey,
        deletedAt: null,
      },
    });
  }

  findAnyByProjectIdAndKey(
    projectId: string,
    flagKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: flagKey,
        },
      },
    });
  }

  findByProjectIdAndKeyWithGroup(
    projectId: string,
    flagKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.findFirst({
      where: {
        projectId,
        key: flagKey,
        deletedAt: null,
      },
      include: {
        group: {
          include: {
            configs: {
              include: {
                environment: true,
              },
            },
          },
        },
      },
    });
  }

  create(
    data: Prisma.FeatureFlagCreateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.create({ data });
  }

  updateByProjectIdAndKey(
    projectId: string,
    flagKey: string,
    data: Prisma.FeatureFlagUpdateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.update({
      where: {
        projectId_key: {
          projectId,
          key: flagKey,
        },
      },
      data,
    });
  }

  touchUpdatedAtByProjectIdAndKey(
    projectId: string,
    flagKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.update({
      where: {
        projectId_key: {
          projectId,
          key: flagKey,
        },
      },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  updateGroupByProjectIdAndKey(
    projectId: string,
    flagKey: string,
    groupId: string | null,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.update({
      where: {
        projectId_key: {
          projectId,
          key: flagKey,
        },
      },
      data: {
        groupId,
      },
      include: {
        group: {
          include: {
            configs: {
              include: {
                environment: true,
              },
            },
          },
        },
      },
    });
  }

  findKeysByGroupId(groupId: string, db: RepositoryClient = this.prisma) {
    return db.featureFlag.findMany({
      where: {
        groupId,
      },
      select: {
        id: true,
        key: true,
      },
      orderBy: {
        key: 'asc',
      },
    });
  }

  findMany(
    where: Prisma.FeatureFlagWhereInput,
    orderBy: Prisma.FeatureFlagOrderByWithRelationInput,
    take: number,
    skip: number,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        environmentConfigs: {
          include: {
            environment: true,
          },
        },
        group: {
          include: {
            configs: {
              include: {
                environment: true,
              },
            },
          },
        },
      },
    });
  }

  count(
    where: Prisma.FeatureFlagWhereInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.count({ where });
  }

  findByProjectIdAndKeyWithConfigs(
    projectId: string,
    flagKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.findFirst({
      where: {
        projectId,
        key: flagKey,
        deletedAt: null,
      },
      include: {
        environmentConfigs: {
          include: {
            environment: true,
            rules: {
              orderBy: {
                priority: 'asc',
              },
            },
          },
        },
        group: {
          include: {
            configs: {
              include: {
                environment: true,
              },
            },
          },
        },
      },
    });
  }

  findDeletedByProjectIdAndKeyWithConfigs(
    projectId: string,
    flagKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.featureFlag.findFirst({
      where: {
        projectId,
        key: flagKey,
        deletedAt: {
          not: null,
        },
      },
      include: {
        environmentConfigs: {
          include: {
            environment: true,
            rules: {
              orderBy: {
                priority: 'asc',
              },
            },
          },
        },
        group: {
          include: {
            configs: {
              include: {
                environment: true,
              },
            },
          },
        },
      },
    });
  }
}
