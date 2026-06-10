import { Prisma } from '@prisma/client';

export type AuditSnapshot = Prisma.InputJsonObject | null;

export function cleanAuditSnapshot<T extends Record<string, unknown>>(
  value: T | null | undefined,
): AuditSnapshot {
  if (!value) {
    return null;
  }

  return removeUndefinedAndNormalize(value) as Prisma.InputJsonObject;
}

function removeUndefinedAndNormalize(
  value: unknown,
): Prisma.InputJsonValue | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedAndNormalize(item))
      .filter((item) => item !== undefined) as Prisma.InputJsonArray;
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, removeUndefinedAndNormalize(item)])
        .filter(([, item]) => item !== undefined),
    ) as Prisma.InputJsonObject;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return String(value);
}
