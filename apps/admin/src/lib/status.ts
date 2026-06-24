import type { FeatureFlag } from './types';

export type StatusLabel = 'Enabled' | 'Disabled' | 'Archived';

export type RuntimeState = {
    label: 'On' | 'Off' | 'Conditional';
    reason: string;
};

export function getFlagStatusLabel(flag: FeatureFlag): StatusLabel {
    if (flag.lifecycleStatus === 'ARCHIVED') {
        return 'Archived';
    }

    return flag.status === 'ENABLED' ? 'Enabled' : 'Disabled';
}

export function getRuntimeState(flag: FeatureFlag): RuntimeState {
    if (flag.lifecycleStatus === 'ARCHIVED') {
        return {
            label: 'Off',
            reason: 'Archived flags are not served.',
        };
    }

    if (flag.status === 'DISABLED') {
        return {
            label: 'Off',
            reason: 'Flag configuration is disabled.',
        };
    }

    if (flag.group?.killSwitch) {
        return {
            label: 'Off',
            reason: `Group kill switch "${flag.group.name}" is active.`,
        };
    }

    if (flag.killSwitch) {
        return {
            label: 'Off',
            reason: 'Flag kill switch is active.',
        };
    }

    if (flag.servingMode === 'GLOBAL_ON') {
        return {
            label: 'On',
            reason: 'Flag is globally enabled.',
        };
    }

    return {
        label: 'Conditional',
        reason: 'Runtime result depends on targeting and rollout rules.',
    };
}

export function formatStatusForDisplay(value: string): string {
    return value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
