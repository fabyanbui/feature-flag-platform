export const KEY_REGEX = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export const KEY_VALIDATION_MESSAGE =
    'Key must be 3-64 characters, lowercase, and may contain only numbers, letters, and dashes.';

export function validateKey(value: string): string | null {
    if (!value.trim()) {
        return 'Key is required.';
    }

    if (!KEY_REGEX.test(value)) {
        return KEY_VALIDATION_MESSAGE;
    }

    return null;
}

export function validateRequired(value: string, label: string): string | null {
    if (!value.trim()) {
        return `${label} is required.`;
    }

    return null;
}

export function parseCsv(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function validatePercentage(value: number): string | null {
    if (Number.isNaN(value)) {
        return 'Percentage is required.';
    }

    if (value < 0 || value > 100) {
        return 'Percentage must be between 0 and 100.';
    }

    if (!Number.isInteger(value * 100)) {
        return 'Percentage can have at most 2 decimal places.';
    }

    return null;
}

export function validateJsonObject(value: string): string | null {
    if (!value.trim()) {
        return null;
    }

    try {
        const parsed = JSON.parse(value);

        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return 'Expected a JSON object.';
        }

        return null;
    } catch {
        return 'Invalid JSON.';
    }
}