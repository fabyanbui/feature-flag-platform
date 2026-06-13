import { RuleType } from '@prisma/client';
import { ApiErrorCode } from '../common/errors/api-error-code';
import { FlagRulesService } from './flag-rules.service';

describe('FlagRulesService', () => {
    const projectsRepository = {
        findByKey: jest.fn(),
    };

    const featureFlagsRepository = {
        findByProjectIdAndKeyWithConfigs: jest.fn(),
    };

    const flagRulesRepository = {
        findMany: jest.fn(),
        count: jest.fn(),
        findByConfigId: jest.fn(),
        deleteByConfigId: jest.fn(),
        createMany: jest.fn(),
    };

    const transactionService = {
        run: jest.fn(),
    };

    const auditLogService = {
        record: jest.fn(),
    };

    const requestContext = {
        getActor: jest.fn(),
        getRequestId: jest.fn(),
    };

    let service: FlagRulesService;

    beforeEach(() => {
        jest.clearAllMocks();

        requestContext.getActor.mockReturnValue('mentor@example.local');
        requestContext.getRequestId.mockReturnValue('req-test');

        service = new FlagRulesService(
            projectsRepository as never,
            featureFlagsRepository as never,
            flagRulesRepository as never,
            transactionService as never,
            auditLogService as never,
            requestContext as never,
        );
    });

    async function expectValidationError(rules: unknown[]) {
        await expect(
            service.replace('demo-project', 'new-checkout', {
                rules,
            } as never),
        ).rejects.toMatchObject({
            response: expect.objectContaining({
                code: ApiErrorCode.VALIDATION_ERROR,
            }),
        });

        expect(transactionService.run).not.toHaveBeenCalled();
        expect(auditLogService.record).not.toHaveBeenCalled();
    }

    describe('replace validation', () => {
        it('rejects duplicate priorities', async () => {
            await expectValidationError([
                {
                    type: RuleType.USER_ALLOWLIST,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        userIds: ['demo-user-beta'],
                    },
                },
                {
                    type: RuleType.ROLE_TARGETING,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        roles: ['beta-tester'],
                    },
                },
            ]);
        });

        it('rejects user allowlist with missing userIds', async () => {
            await expectValidationError([
                {
                    type: RuleType.USER_ALLOWLIST,
                    priority: 10,
                    enabled: true,
                    parameters: {},
                },
            ]);
        });

        it('rejects user allowlist with empty userIds', async () => {
            await expectValidationError([
                {
                    type: RuleType.USER_ALLOWLIST,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        userIds: [],
                    },
                },
            ]);
        });

        it('rejects user allowlist with whitespace-only userIds', async () => {
            await expectValidationError([
                {
                    type: RuleType.USER_ALLOWLIST,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        userIds: ['   '],
                    },
                },
            ]);
        });

        it('rejects role targeting with missing roles', async () => {
            await expectValidationError([
                {
                    type: RuleType.ROLE_TARGETING,
                    priority: 10,
                    enabled: true,
                    parameters: {},
                },
            ]);
        });

        it('rejects role targeting with empty roles', async () => {
            await expectValidationError([
                {
                    type: RuleType.ROLE_TARGETING,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        roles: [],
                    },
                },
            ]);
        });

        it('rejects role targeting with whitespace-only roles', async () => {
            await expectValidationError([
                {
                    type: RuleType.ROLE_TARGETING,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        roles: ['   '],
                    },
                },
            ]);
        });

        it('rejects percentage rollout below 0', async () => {
            await expectValidationError([
                {
                    type: RuleType.PERCENTAGE_ROLLOUT,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        percentage: -1,
                    },
                },
            ]);
        });

        it('rejects percentage rollout above 100', async () => {
            await expectValidationError([
                {
                    type: RuleType.PERCENTAGE_ROLLOUT,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        percentage: 101,
                    },
                },
            ]);
        });

        it('rejects percentage rollout with more than two decimals', async () => {
            await expectValidationError([
                {
                    type: RuleType.PERCENTAGE_ROLLOUT,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        percentage: 10.123,
                    },
                },
            ]);
        });

        it('rejects percentage rollout supplied as a string', async () => {
            await expectValidationError([
                {
                    type: RuleType.PERCENTAGE_ROLLOUT,
                    priority: 10,
                    enabled: true,
                    parameters: {
                        percentage: '50',
                    },
                },
            ]);
        });

        it('rejects unsupported rule type', async () => {
            await expectValidationError([
                {
                    type: 'UNKNOWN_RULE_TYPE',
                    priority: 10,
                    enabled: true,
                    parameters: {},
                },
            ]);
        });
    });
});