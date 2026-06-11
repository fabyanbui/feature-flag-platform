import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { SampleUsersController } from './sample-users.controller';
import { SampleUsersService } from './sample-users.service';

@Module({
  imports: [CommonModule, DatabaseModule, RepositoriesModule, AuditModule],
  controllers: [SampleUsersController],
  providers: [SampleUsersService],
  exports: [SampleUsersService],
})
export class SampleUsersModule {}
