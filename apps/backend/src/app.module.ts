import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { ProjectsModule } from './projects/projects.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { FlagRulesModule } from './flag-rules/flag-rules.module';
import { SampleUsersModule } from './sample-users/sample-users.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { FlagGroupsModule } from './flag-groups/flag-groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    CommonModule,
    DatabaseModule,
    AuditModule,
    RepositoriesModule,
    EvaluationModule,
    ProjectsModule,
    FeatureFlagsModule,
    FlagRulesModule,
    SampleUsersModule,
    AuditLogsModule,
    FlagGroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
