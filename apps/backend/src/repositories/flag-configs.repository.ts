import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class FlagConfigsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByFlagIdAndEnvironmentId(
    flagId: string,
    environmentId: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagEnvironmentConfig.findUnique({
      where: {
        flagId_environmentId: {
          flagId,
          environmentId,
        },
      },
    });
  }

  create(
    data: Prisma.FlagEnvironmentConfigUncheckedCreateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagEnvironmentConfig.create({ data });
  }

  updateById(
    id: string,
    data: Prisma.FlagEnvironmentConfigUpdateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagEnvironmentConfig.update({
      where: { id },
      data,
    });
  }
}
