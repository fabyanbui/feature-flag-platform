import { Logger } from '@nestjs/common';
import {
  FeatureFlagLifecycleStatus,
  FlagConfigStatus,
  RuleType,
  ServingMode,
} from '@prisma/client';
import { EvaluationReason } from './engine/evaluation.types';
import { EvaluationService } from './evaluation.service';

describe('EvaluationService', () => {
  const globalOnSnapshot = {
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
  };

  const targetedSnapshot = {
    flag: {
      lifecycleStatus: FeatureFlagLifecycleStatus.ACTIVE,
    },
    group: null,
    config: {
      status: FlagConfigStatus.ENABLED,
      servingMode: ServingMode.TARGETED,
      killSwitch: false,
    },
    rules: [
      {
        id: 'role-rule',
        type: RuleType.ROLE_TARGETING,
        priority: 10,
        enabled: true,
        parameters: {
          roles: ['beta-tester'],
        },
      },
    ],
  };

  const evaluationRepository = {
    findSnapshot: jest.fn(),
  };

  const snapshotCache = {
    get: jest.fn(),
    set: jest.fn(),
    invalidateFlag: jest.fn(),
    invalidateFlags: jest.fn(),
    clear: jest.fn(),
  };

  const requestContext = {
    getRequestId: jest.fn(),
  };

  const evaluationMetricsService = {
    record: jest.fn(),
  };

  let service: EvaluationService;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    loggerDebugSpy = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);

    requestContext.getRequestId.mockReturnValue('req-test');
    snapshotCache.get.mockResolvedValue(null);
    snapshotCache.set.mockResolvedValue(undefined);
    evaluationMetricsService.record.mockResolvedValue(undefined);

    service = new EvaluationService(
      evaluationRepository as never,
      requestContext as never,
      snapshotCache,
      evaluationMetricsService,
    );
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerDebugSpy.mockRestore();
  });

  it('calls cache and repository with projectKey, environmentKey, and flagKey on a cache miss', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue(null);

    await service.evaluate({
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'demo-user-beta',
      },
    });

    expect(snapshotCache.get).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
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

    expect(snapshotCache.set).not.toHaveBeenCalled();
  });

  it('returns engine result when repository returns a valid snapshot', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue(globalOnSnapshot);

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

  it('evaluates a cache hit without loading or updating the repository snapshot', async () => {
    snapshotCache.get.mockResolvedValue(globalOnSnapshot);

    await expect(
      service.evaluate({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
        context: {
          targetingKey: 'stable-user-1',
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

    expect(evaluationRepository.findSnapshot).not.toHaveBeenCalled();
    expect(snapshotCache.set).not.toHaveBeenCalled();
  });

  it('records one aggregate metric for an evaluation served from cache', async () => {
    snapshotCache.get.mockResolvedValue(globalOnSnapshot);

    const result = await service.evaluate({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'private-targeting-key',
        userId: 'private-user-id',
        roles: ['beta-tester'],
        attributes: {
          country: 'VN',
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        enabled: true,
        reason: EvaluationReason.GLOBAL_ON,
      }),
    );

    expect(evaluationMetricsService.record).toHaveBeenCalledTimes(1);
    expect(evaluationMetricsService.record).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      enabled: true,
      reason: EvaluationReason.GLOBAL_ON,
    });

    const [metric] = evaluationMetricsService.record.mock.calls[0] as [
      Record<string, unknown>,
    ];

    expect(Object.keys(metric).sort()).toEqual(
      ['enabled', 'environmentKey', 'flagKey', 'projectKey', 'reason'].sort(),
    );
    expect(metric).not.toHaveProperty('context');
    expect(metric).not.toHaveProperty('targetingKey');
    expect(metric).not.toHaveProperty('userId');
    expect(metric).not.toHaveProperty('roles');
    expect(metric).not.toHaveProperty('attributes');
    expect(metric).not.toHaveProperty('matchedRuleId');
    expect(evaluationRepository.findSnapshot).not.toHaveBeenCalled();
  });

  it('records one aggregate metric for an evaluation loaded from the repository', async () => {
    snapshotCache.get.mockResolvedValue(null);
    evaluationRepository.findSnapshot.mockResolvedValue(globalOnSnapshot);

    await service.evaluate({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'stable-user',
      },
    });

    expect(evaluationMetricsService.record).toHaveBeenCalledTimes(1);
    expect(evaluationMetricsService.record).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      enabled: true,
      reason: EvaluationReason.GLOBAL_ON,
    });
  });

  it('records NOT_FOUND without storing evaluation context', async () => {
    snapshotCache.get.mockResolvedValue(null);
    evaluationRepository.findSnapshot.mockResolvedValue(null);

    const result = await service.evaluate({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'missing-flag',
      context: {
        targetingKey: 'must-not-be-recorded',
        roles: ['must-not-be-recorded'],
      },
    });

    expect(result.reason).toBe(EvaluationReason.NOT_FOUND);
    expect(evaluationMetricsService.record).toHaveBeenCalledTimes(1);
    expect(evaluationMetricsService.record).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'missing-flag',
      enabled: false,
      reason: EvaluationReason.NOT_FOUND,
    });
  });

  it('records the safe ERROR result with an unresolved environment when evaluation fails', async () => {
    snapshotCache.get.mockResolvedValue(null);
    evaluationRepository.findSnapshot.mockRejectedValue(
      new Error('database unavailable'),
    );

    const result = await service.evaluate({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'stable-user',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        enabled: false,
        reason: EvaluationReason.ERROR,
      }),
    );
    expect(evaluationMetricsService.record).toHaveBeenCalledTimes(1);
    expect(evaluationMetricsService.record).toHaveBeenCalledWith({
      projectKey: 'demo-project',
      environmentKey: '__unresolved__',
      flagKey: 'new-checkout',
      enabled: false,
      reason: EvaluationReason.ERROR,
    });
  });

  it('loads and stores a snapshot on a cache miss', async () => {
    evaluationRepository.findSnapshot.mockResolvedValue(globalOnSnapshot);

    await service.evaluate({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'stable-user-1',
      },
    });

    const address = {
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    };

    expect(evaluationRepository.findSnapshot).toHaveBeenCalledWith(address);
    expect(snapshotCache.set).toHaveBeenCalledWith(address, globalOnSnapshot);
  });

  it('falls back to the repository when cache reading fails', async () => {
    snapshotCache.get.mockRejectedValue(new Error('cache unavailable'));
    evaluationRepository.findSnapshot.mockResolvedValue(globalOnSnapshot);

    await expect(
      service.evaluate({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
        context: {
          targetingKey: 'stable-user-1',
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        enabled: true,
        reason: EvaluationReason.GLOBAL_ON,
      }),
    );

    expect(evaluationRepository.findSnapshot).toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('falling back to repository'),
      expect.any(String),
    );
  });

  it('returns the evaluation result when cache writing fails', async () => {
    snapshotCache.set.mockRejectedValue(new Error('cache write failed'));
    evaluationRepository.findSnapshot.mockResolvedValue(globalOnSnapshot);

    await expect(
      service.evaluate({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
        context: {
          targetingKey: 'stable-user-1',
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        enabled: true,
        reason: EvaluationReason.GLOBAL_ON,
      }),
    );

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('continuing without cache'),
      expect.any(String),
    );
  });

  it('reuses one cached snapshot for different request contexts', async () => {
    snapshotCache.get.mockResolvedValue(targetedSnapshot);

    const betaResult = await service.evaluate({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'stable-beta-user',
        roles: ['beta-tester'],
      },
    });

    const regularResult = await service.evaluate({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      context: {
        targetingKey: 'stable-regular-user',
        roles: ['customer'],
      },
    });

    expect(betaResult).toEqual(
      expect.objectContaining({
        enabled: true,
        reason: EvaluationReason.ROLE_MATCH,
      }),
    );
    expect(regularResult).toEqual(
      expect.objectContaining({
        enabled: false,
        reason: EvaluationReason.DEFAULT_OFF,
      }),
    );
    expect(evaluationRepository.findSnapshot).not.toHaveBeenCalled();
    expect(snapshotCache.set).not.toHaveBeenCalled();
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
    snapshotCache.get.mockResolvedValue({
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
    snapshotCache.get.mockResolvedValue(globalOnSnapshot);

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
