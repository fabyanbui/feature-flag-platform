import { Logger } from '@nestjs/common';
import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  ServingMode,
} from '@prisma/client';
import { EvaluationReason } from './engine/evaluation.types';
import { EvaluationService } from './evaluation.service';

describe('EvaluationService', () => {
  const evaluationRepository = {
    findSnapshot: jest.fn(),
  };

  const requestContext = {
    getRequestId: jest.fn(),
  };

  let service: EvaluationService;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    requestContext.getRequestId.mockReturnValue('req-test');

    service = new EvaluationService(
      evaluationRepository as never,
      requestContext as never,
    );
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('calls repository with projectKey, environmentKey, and flagKey', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue(null);

    await service.evaluate({
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'demo-user-beta',
      },
    });

    expect(evaluationRepository.findSnapshot).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
    });
  });

  it('returns NOT_FOUND result when repository returns no snapshot', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue(null);

    await expect(
      service.evaluate({
        projectKey: 'demo-project',
        flagKey: 'missing-flag',
        context: {
          targetingKey: 'demo-user-beta',
        },
      }),
    ).resolves.toEqual({
      projectKey: 'demo-project',
      flagKey: 'missing-flag',
      enabled: false,
      variant: 'off',
      reason: EvaluationReason.NOT_FOUND,
      matchedRuleId: null,
    });
  });

  it('returns engine result when repository returns a valid snapshot', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue({
      flag: {
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
      },
      group: null,
      config: {
        status: FlagConfigStatus.ENABLED,
        servingMode: ServingMode.GLOBAL_ON,
        killSwitch: false,
      },
      rules: [],
    });

    await expect(
      service.evaluate({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
        context: {
          targetingKey: 'demo-user-beta',
        },
      }),
    ).resolves.toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      enabled: true,
      variant: 'on',
      reason: EvaluationReason.GLOBAL_ON,
      matchedRuleId: null,
    });
  });

  it('returns safe ERROR result when repository throws', async () => {
    evaluationRepository.findSnapshot.mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(
      service.evaluate({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
        context: {
          targetingKey: 'demo-user-beta',
        },
      }),
    ).resolves.toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      enabled: false,
      variant: 'off',
      reason: EvaluationReason.ERROR,
      matchedRuleId: null,
    });
  });

  it('returns safe ERROR result when evaluation engine processing throws', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue({
      flag: {
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
      },
      group: null,
      config: {
        status: FlagConfigStatus.ENABLED,
        servingMode: ServingMode.TARGETED,
        killSwitch: false,
      },
      rules: null,
    });

    await expect(
      service.evaluate({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
        context: {
          targetingKey: 'demo-user-beta',
        },
      }),
    ).resolves.toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      enabled: false,
      variant: 'off',
      reason: EvaluationReason.ERROR,
      matchedRuleId: null,
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('requestId=req-test'),
      expect.any(String),
    );
  });

  it('uses request ID from request context on error path', async () => {
    evaluationRepository.findSnapshot.mockRejectedValue(
      new Error('database unavailable'),
    );

    await service.evaluate({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'demo-user-beta',
      },
    });

    expect(requestContext.getRequestId).toHaveBeenCalled();

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('requestId=req-test'),
      expect.any(String),
    );
  });

  it('does not include environmentKey in engine input response', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue({
      flag: {
        lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
      },
      group: null,
      config: {
        status: FlagConfigStatus.ENABLED,
        servingMode: ServingMode.GLOBAL_ON,
        killSwitch: false,
      },
      rules: [],
    });

    const result = await service.evaluate({
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'demo-user-beta',
      },
    });

    expect(result).toEqual({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      enabled: true,
      variant: 'on',
      reason: EvaluationReason.GLOBAL_ON,
      matchedRuleId: null,
    });
  });
});
