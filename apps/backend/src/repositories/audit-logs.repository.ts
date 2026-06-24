import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.AuditLogEntryWhereInput,
    orderBy: Prisma.AuditLogEntryOrderByWithRelationInput,
    take: number,
    skip: number,
    db: RepositoryClient = this.prisma,
  ) {
    return db.auditLogEntry.findMany({
      where,
      orderBy,
      take,
      skip,
    });
  }

  count(
    where: Prisma.AuditLogEntryWhereInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.auditLogEntry.count({ where });
  }
}
