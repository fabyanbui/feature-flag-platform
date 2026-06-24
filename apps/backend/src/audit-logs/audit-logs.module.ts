import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { FlagHistoryController } from './flag-history.controller';

@Module({
  imports: [CommonModule, RepositoriesModule],
  controllers: [AuditLogsController, FlagHistoryController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
