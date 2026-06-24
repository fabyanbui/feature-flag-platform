import type { FeatureFlag } from '../lib/types';
import { getRuntimeState } from '../lib/status';

type RuntimeStateBadgeProps = {
    flag: FeatureFlag;
};

export function RuntimeStateBadge({ flag }: RuntimeStateBadgeProps) {
    const runtime = getRuntimeState(flag);

    return (
        <span
            className={`badge runtime-badge runtime-badge-${runtime.label.toLowerCase()}`}
            aria-label={`Runtime state: ${runtime.label}. ${runtime.reason}`}
            title={runtime.reason}
        >
            Runtime: {runtime.label}
        </span>
    );
}