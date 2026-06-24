import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class FlagGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProjectIdAndKey(
    projectId: string,
    groupKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroup.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: groupKey,
        },
      },
    });
  }

  findByProjectIdAndKeyWithConfigs(
    projectId: string,
    groupKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroup.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: groupKey,
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
  }

  create(
    data: Prisma.FlagGroupUncheckedCreateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroup.create({ data });
  }

  updateByProjectIdAndKey(
    projectId: string,
    groupKey: string,
    data: Prisma.FlagGroupUpdateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroup.update({
      where: {
        projectId_key: {
          projectId,
          key: groupKey,
        },
      },
      data,
    });
  }

  findMany(
    where: Prisma.FlagGroupWhereInput,
    orderBy: Prisma.FlagGroupOrderByWithRelationInput,
    take: number,
    skip: number,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroup.findMany({
      where,
      orderBy,
      take,
      skip,
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
  }

  count(where: Prisma.FlagGroupWhereInput, db: RepositoryClient = this.prisma) {
    return db.flagGroup.count({ where });
  }
}
