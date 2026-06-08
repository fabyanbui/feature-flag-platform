import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RepositoryClient } from './repository-client.type';

@Injectable()
export class SampleUsersRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByProjectId(
        projectId: string,
        db: RepositoryClient = this.prisma,
    ) {
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
}