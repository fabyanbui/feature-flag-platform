import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class EnvironmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDefaultByProjectId(
    projectId: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.environment.findFirst({
      where: {
        projectId,
        isDefault: true,
      },
    });
  }

  findByProjectIdAndKey(
    projectId: string,
    environmentKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.environment.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: environmentKey,
        },
      },
    });
  }

  create(
    data: Prisma.EnvironmentUncheckedCreateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.environment.create({ data });
  }
}
