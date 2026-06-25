import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { EvaluationMetricsService } from './evaluation-metrics.service';

@Module({
  imports: [RepositoriesModule],
  providers: [EvaluationMetricsService],
  exports: [EvaluationMetricsService],
})
export class StatsModule {}
