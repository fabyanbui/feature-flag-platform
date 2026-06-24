import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';

export interface RecordAuditLogInput {
  projectId: string;
  projectKey: string;

  environmentId?: string | null;
  environmentKey?: string | null;

  targetType: AuditTargetType;
  targetId: string;
  targetKey?: string | null;

  action: AuditAction;
  actor: string;

  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;

  requestId: string;
}
