import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { FlagRulesController } from './flag-rules.controller';
import { FlagRulesService } from './flag-rules.service';

@Module({
  imports: [CommonModule, DatabaseModule, RepositoriesModule, AuditModule],
  controllers: [FlagRulesController],
  providers: [FlagRulesService],
  exports: [FlagRulesService],
})
export class FlagRulesModule {}
