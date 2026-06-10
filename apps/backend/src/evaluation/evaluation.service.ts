import { Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from '../common/request-context/request-context.service';
import { EvaluateRequestDto } from './dto/evaluate-request.dto';
import {
    errorResult,
    evaluateFlag,
    notFoundResult,
} from './engine/evaluation-engine';
import type { EvaluationInput } from './engine/evaluation.types';
import { EvaluationRepository } from './evaluation.repository';

@Injectable()
export class EvaluationService {
    private readonly logger = new Logger(EvaluationService.name);

    constructor(
        private readonly evaluationRepository: EvaluationRepository,
        private readonly requestContext: RequestContextService,
    ) { }

    async evaluate(request: EvaluateRequestDto) {
        const input: EvaluationInput = {
            projectKey: request.projectKey,
            flagKey: request.flagKey,
            context: request.context,
        };

        try {
            const snapshot = await this.evaluationRepository.findSnapshot({
                projectKey: request.projectKey,
                environmentKey: request.environmentKey,
                flagKey: request.flagKey,
            });

            if (!snapshot) {
                return notFoundResult(input);
            }

            return evaluateFlag(input, snapshot);
        } catch (error) {
            this.logger.error(
                `Evaluation failed safely. requestId=${this.requestContext.getRequestId()}`,
                error instanceof Error ? error.stack : String(error),
            );

            return errorResult(input);
        }
    }
}