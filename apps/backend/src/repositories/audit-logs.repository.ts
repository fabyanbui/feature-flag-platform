import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.AuditLogEntryWhereInput,
    take: number,
    skip: number,
    db: RepositoryClient = this.prisma,
  ) {
    return db.auditLogEntry.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  count(
    where: Prisma.AuditLogEntryWhereInput,
    db: RepositoryClient = this.prisma,
  ) {
    return db.auditLogEntry.count({ where });
  }
}
