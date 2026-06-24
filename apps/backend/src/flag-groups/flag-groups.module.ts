import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { FlagGroupAssignmentsController } from './flag-group-assignments.controller';
import { FlagGroupsController } from './flag-groups.controller';
import { FlagGroupsService } from './flag-groups.service';

@Module({
  imports: [CommonModule, DatabaseModule, RepositoriesModule, AuditModule],
  controllers: [FlagGroupsController, FlagGroupAssignmentsController],
  providers: [FlagGroupsService],
  exports: [FlagGroupsService],
})
export class FlagGroupsModule {}
