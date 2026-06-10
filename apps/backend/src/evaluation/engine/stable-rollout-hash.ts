import { createHash } from 'node:crypto';

export interface StableRolloutHashInput {
  projectKey: string;
  flagKey: string;
  targetingKey: string;
}

export function getStableRolloutBucketPercentage(
  input: StableRolloutHashInput,
): number {
  const targetingKey = input.targetingKey.trim();

  const hashInput = `${input.projectKey}:${input.flagKey}:${targetingKey}`;

  const digest = createHash('sha256').update(hashInput, 'utf8').digest();

  const first64Bits = digest.readBigUInt64BE(0);
  const bucket = Number(first64Bits % 10000n);

  return bucket / 100;
}

export function isValidRolloutPercentage(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100 &&
    Number.isInteger(value * 100)
  );
}
