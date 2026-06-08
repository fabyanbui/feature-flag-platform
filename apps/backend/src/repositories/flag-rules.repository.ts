import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class FlagRulesRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByConfigId(
        flagConfigId: string,
        db: RepositoryClient = this.prisma,
    ) {
        return db.flagRule.findMany({
            where: { flagConfigId },
            orderBy: { priority: 'asc' },
        });
    }

    create(
        data: Prisma.FlagRuleCreateInput,
        db: RepositoryClient = this.prisma,
    ) {
        return db.flagRule.create({ data });
    }

    deleteByConfigId(
        flagConfigId: string,
        db: RepositoryClient = this.prisma,
    ) {
        return db.flagRule.deleteMany({
            where: { flagConfigId },
        });
    }
}