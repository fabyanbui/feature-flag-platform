import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class FlagRulesRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByConfigId(flagConfigId: string, db: RepositoryClient = this.prisma) {
    return db.flagRule.findMany({
      where: { flagConfigId },
      orderBy: { priority: 'asc' },
    });
  }

  create(data: Prisma.FlagRuleCreateInput, db: RepositoryClient = this.prisma) {
    return db.flagRule.create({ data });
  }

  deleteByConfigId(flagConfigId: string, db: RepositoryClient = this.prisma) {
    return db.flagRule.deleteMany({
      where: { flagConfigId },
    });
  }

  findMany(
    where: Prisma.FlagRuleWhereInput,
    orderBy: Prisma.FlagRuleOrderByWithRelationInput,
    take: number,
    skip: number,
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagRule.findMany({
      where,
      orderBy,
      take,
      skip,
    });
  }

  count(where: Prisma.FlagRuleWhereInput, db: RepositoryClient = this.prisma) {
    return db.flagRule.count({ where });
  }

  createMany(
    data: Prisma.FlagRuleCreateManyInput[],
    db: RepositoryClient = this.prisma,
  ) {
    return db.flagRule.createMany({ data });
  }
}
