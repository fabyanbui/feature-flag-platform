import {
  getStableRolloutBucketPercentage,
  isValidRolloutPercentage,
} from './stable-rollout-hash';

describe('stable rollout hash', () => {
  it('returns the same bucket for the same input', () => {
    const input = {
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      targetingKey: 'demo-user-regular',
    };

    expect(getStableRolloutBucketPercentage(input)).toBe(
      getStableRolloutBucketPercentage(input),
    );
  });

  it('returns a bucket in the 0.00 to 99.99 range', () => {
    const bucket = getStableRolloutBucketPercentage({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      targetingKey: 'demo-user-regular',
    });

    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThan(100);
  });

  it('preserves targeting key case after trimming surrounding whitespace', () => {
    const lowercaseBucket = getStableRolloutBucketPercentage({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      targetingKey: 'demo-user',
    });

    const uppercaseBucket = getStableRolloutBucketPercentage({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      targetingKey: 'Demo-User',
    });

    const trimmedBucket = getStableRolloutBucketPercentage({
      projectKey: 'demo-project',
      flagKey: 'new-checkout',
      targetingKey: '  demo-user  ',
    });

    expect(trimmedBucket).toBe(lowercaseBucket);
    expect(uppercaseBucket).not.toBe(lowercaseBucket);
  });
});

describe('rollout percentage validation', () => {
  it.each([0, 25, 50.5, 99.99, 100])(
    'accepts valid percentage %s',
    (percentage) => {
      expect(isValidRolloutPercentage(percentage)).toBe(true);
    },
  );

  it.each([-1, 100.01, 25.123, '25', Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid percentage %s',
    (percentage) => {
      expect(isValidRolloutPercentage(percentage)).toBe(false);
    },
  );
});
