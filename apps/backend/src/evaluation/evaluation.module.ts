import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../database/database.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationService } from './evaluation.service';

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, EvaluationRepository],
})
export class EvaluationModule {}
