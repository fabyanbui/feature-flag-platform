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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
