import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { EvaluationCacheModule } from './cache/evaluation-cache.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationService } from './evaluation.service';

@Module({
  imports: [CommonModule, DatabaseModule, EvaluationCacheModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, EvaluationRepository],
})
export class EvaluationModule {}
