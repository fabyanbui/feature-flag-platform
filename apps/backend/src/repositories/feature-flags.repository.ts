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
    return db.featureFlag.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: flagKey,
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
}
