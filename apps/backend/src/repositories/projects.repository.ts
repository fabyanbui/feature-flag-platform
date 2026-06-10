import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByKey(projectKey: string, db: RepositoryClient = this.prisma) {
    return db.project.findUnique({
      where: { key: projectKey },
    });
  }

  create(data: Prisma.ProjectCreateInput, db: RepositoryClient = this.prisma) {
    return db.project.create({ data });
  }

  updateByKey(
    projectKey: string,
    data: Prisma.ProjectUpdateInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.project.update({
      where: { key: projectKey },
      data,
    });
  }

  findMany(
    where: Prisma.ProjectWhereInput,
    orderBy: Prisma.ProjectOrderByWithRelationInput,
    take: number,
    skip: number,
    db: RepositoryClient = this.prisma,
  ) {
    return db.project.findMany({
      where,
      orderBy,
      take,
      skip,
    });
  }

  count(where: Prisma.ProjectWhereInput, db: RepositoryClient = this.prisma) {
    return db.project.count({ where });
  }
}
