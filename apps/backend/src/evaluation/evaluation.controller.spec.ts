import { EvaluationReason } from './engine/evaluation.types';
import { EvaluationController } from './evaluation.controller';

describe('EvaluationController', () => {
    const evaluationService = {
        evaluate: jest.fn(),
    };

    let controller: EvaluationController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new EvaluationController(evaluationService as never);
    });

    it('passes request body to evaluation service and returns result', async () => {
        const body = {
            projectKey: 'demo-project',
            flagKey: 'new-checkout',
            context: {
                targetingKey: 'demo-user-beta',
            },
        };

        const response = {
            projectKey: 'demo-project',
            flagKey: 'new-checkout',
            enabled: true,
            variant: 'on',
            reason: EvaluationReason.GLOBAL_ON,
            matchedRuleId: null,
        };

        evaluationService.evaluate.mockResolvedValue(response);

        await expect(controller.evaluate(body)).resolves.toBe(response);
        expect(evaluationService.evaluate).toHaveBeenCalledWith(body);
    });
});