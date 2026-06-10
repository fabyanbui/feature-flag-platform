import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { RequestContextService } from './common/request-context/request-context.service';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './audit/audit.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { EvaluationModule } from './evaluation/evaluation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DatabaseModule,
    AuditModule,
    RepositoriesModule,
    EvaluationModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestContextService, ApiExceptionFilter],
})
export class AppModule { }