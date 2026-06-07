import { Injectable } from '@nestjs/common';
import { TransactionClient } from '../database/transaction.service';
import { RecordAuditLogInput } from './audit-log.types';

@Injectable()
export class AuditLogService {
  async record(tx: TransactionClient, input: RecordAuditLogInput) {
    return tx.auditLogEntry.create({
      data: {
        projectId: input.projectId,
        projectKey: input.projectKey,

        environmentId: input.environmentId ?? null,
        environmentKey: input.environmentKey ?? null,

        targetType: input.targetType,
        targetId: input.targetId,
        targetKey: input.targetKey ?? null,

        action: input.action,
        actor: input.actor,

        before: input.before ?? null,
        after: input.after ?? null,
        metadata: input.metadata ?? { source: 'api' },

        requestId: input.requestId,
      },
    });
  }
}
