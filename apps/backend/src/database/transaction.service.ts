import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

export type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class TransactionService {
    constructor(private readonly prisma: PrismaService) { }

    async run<T>(
        callback: (tx: TransactionClient) => Promise<T>,
    ): Promise<T> {
        return this.prisma.$transaction(async (tx) => {
            return callback(tx);
        });
    }
}