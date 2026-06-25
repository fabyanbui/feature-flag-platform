import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { EvaluationMetricsService } from './evaluation-metrics.service';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [StatsController],
  providers: [EvaluationMetricsService, StatsService],
  exports: [EvaluationMetricsService, StatsService],
})
export class StatsModule {}
