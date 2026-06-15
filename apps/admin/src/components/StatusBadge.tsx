import type { FeatureFlag } from '../lib/types';
import { getFlagStatusLabel } from '../lib/status';

type StatusBadgeProps = {
    flag: FeatureFlag;
};

export function StatusBadge({ flag }: StatusBadgeProps) {
    const label = getFlagStatusLabel(flag);

    return (
        <span
            className={`badge status-badge status-badge-${label.toLowerCase()}`}
            aria-label={`Feature flag status: ${label}`}
            title={`Feature flag status: ${label}`}
        >
            Status: {label}
        </span>
    );
}