import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class SampleUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProjectId(projectId: string, db: RepositoryClient = this.prisma) {
    return db.sampleUserContext.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    data: Prisma.SampleUserContextCreateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.sampleUserContext.create({ data });
  }

  findMany(
    where: Prisma.SampleUserContextWhereInput,
    orderBy: Prisma.SampleUserContextOrderByWithRelationInput,
    take: number,
    skip: number,
    db: RepositoryClient = this.prisma,
  ) {
    return db.sampleUserContext.findMany({
      where,
      orderBy,
      take,
      skip,
    });
  }

  count(
    where: Prisma.SampleUserContextWhereInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.sampleUserContext.count({ where });
  }

  findByProjectIdAndTargetingKey(
    projectId: string,
    targetingKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.sampleUserContext.findUnique({
      where: {
        projectId_targetingKey: {
          projectId,
          targetingKey,
        },
      },
    });
  }

  deleteByProjectIdAndTargetingKey(
    projectId: string,
    targetingKey: string,
    db: RepositoryClient = this.prisma,
  ) {
    return db.sampleUserContext.delete({
      where: {
        projectId_targetingKey: {
          projectId,
          targetingKey,
        },
      },
    });
  }
}
