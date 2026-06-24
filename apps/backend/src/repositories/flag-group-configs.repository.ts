import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class FlagGroupConfigsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByGroupIdAndEnvironmentId(
    groupId: string,
    environmentId: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroupConfig.findUnique({
      where: {
        groupId_environmentId: {
          groupId,
          environmentId,
        },
      },
    });
  }

  create(
    data: Prisma.FlagGroupConfigUncheckedCreateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroupConfig.create({ data });
  }

  upsertByGroupIdAndEnvironmentId(
    groupId: string,
    environmentId: string,
    create: Prisma.FlagGroupConfigUncheckedCreateInput,
    update: Prisma.FlagGroupConfigUpdateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroupConfig.upsert({
      where: {
        groupId_environmentId: {
          groupId,
          environmentId,
        },
      },
      create,
      update,
    });
  }

  updateById(
    id: string,
    data: Prisma.FlagGroupConfigUpdateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagGroupConfig.update({
      where: { id },
      data,
    });
  }
}
