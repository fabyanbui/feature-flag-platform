import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditLogsRepository } from './audit-logs.repository';
import { FeatureFlagsRepository } from './feature-flags.repository';
import { FlagRulesRepository } from './flag-rules.repository';
import { ProjectsRepository } from './projects.repository';
import { SampleUsersRepository } from './sample-users.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    ProjectsRepository,
    FeatureFlagsRepository,
    FlagRulesRepository,
    SampleUsersRepository,
    AuditLogsRepository,
  ],
  exports: [
    ProjectsRepository,
    FeatureFlagsRepository,
    FlagRulesRepository,
    SampleUsersRepository,
    AuditLogsRepository,
  ],
})
export class RepositoriesModule {}
