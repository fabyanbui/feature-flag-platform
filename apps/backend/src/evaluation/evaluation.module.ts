import { Module } from '@nestjs/common';
import { RequestContextService } from '../common/request-context/request-context.service';
import { DatabaseModule } from '../database/database.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationRepository } from './evaluation.repository';
import { EvaluationService } from './evaluation.service';

@Module({
    imports: [DatabaseModule],
    controllers: [EvaluationController],
    providers: [
        EvaluationService,
        EvaluationRepository,
        RequestContextService,
    ],
})
export class EvaluationModule { }