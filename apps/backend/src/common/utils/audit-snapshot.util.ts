export type AuditSnapshot = Record<string, unknown> | null;

export function cleanAuditSnapshot<T extends Record<string, unknown>>(
    value: T | null | undefined,
): AuditSnapshot {
    if (!value) {
        return null;
    }

    return removeUndefinedAndNormalize(value) as Record<string, unknown>;
}

function removeUndefinedAndNormalize(value: unknown): unknown {
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
            .filter((item) => item !== undefined);
    }

    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .map(([key, item]) => [key, removeUndefinedAndNormalize(item)])
                .filter(([, item]) => item !== undefined),
        );
    }

    return value;
}