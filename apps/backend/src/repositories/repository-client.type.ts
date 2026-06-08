import { PrismaService } from '../database/prisma.service';
import { TransactionClient } from '../database/transaction.service';

export type RepositoryClient = PrismaService | TransactionClient;