import { PrismaService } from '../src/database/prisma.service';

export async function cleanDatabase(_prisma: PrismaService) {
  void _prisma;

  // Intentionally no-op.
  //
  // The database enforces audit logs as append-only, so tests must not delete
  // audit_log_entries or parent projects referenced by audit entries. E2E tests
  // isolate themselves with unique project keys instead.
}
