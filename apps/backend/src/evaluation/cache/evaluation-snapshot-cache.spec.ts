import {
  buildEvaluationSnapshotCacheKey,
  DEFAULT_ENVIRONMENT_CACHE_SCOPE,
} from './evaluation-snapshot-cache';

describe('buildEvaluationSnapshotCacheKey', () => {
  it('builds a key using the explicit environment', () => {
    expect(
      buildEvaluationSnapshotCacheKey({
        projectKey: 'demo-project',
        environmentKey: 'production',
        flagKey: 'new-checkout',
      }),
    ).toBe('evaluation-snapshot:demo-project:production:new-checkout');
  });

  it('uses the internal default scope when environment is omitted', () => {
    expect(
      buildEvaluationSnapshotCacheKey({
        projectKey: 'demo-project',
        flagKey: 'new-checkout',
      }),
    ).toBe(
      `evaluation-snapshot:demo-project:${DEFAULT_ENVIRONMENT_CACHE_SCOPE}:new-checkout`,
    );
  });

  it('creates different keys for different environments', () => {
    const productionKey = buildEvaluationSnapshotCacheKey({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    });
    const stagingKey = buildEvaluationSnapshotCacheKey({
      projectKey: 'demo-project',
      environmentKey: 'staging',
      flagKey: 'new-checkout',
    });

    expect(productionKey).not.toBe(stagingKey);
  });

  it('creates different keys for different flags', () => {
    const checkoutKey = buildEvaluationSnapshotCacheKey({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    });
    const recommendationKey = buildEvaluationSnapshotCacheKey({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'recommendations',
    });

    expect(checkoutKey).not.toBe(recommendationKey);
  });

  it('creates different keys for different projects', () => {
    const firstProjectKey = buildEvaluationSnapshotCacheKey({
      projectKey: 'demo-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    });
    const secondProjectKey = buildEvaluationSnapshotCacheKey({
      projectKey: 'other-project',
      environmentKey: 'production',
      flagKey: 'new-checkout',
    });

    expect(firstProjectKey).not.toBe(secondProjectKey);
  });
});
