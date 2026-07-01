import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import { RuntimeStateBadge } from '../components/RuntimeStateBadge';
import { StatusBadge } from '../components/StatusBadge';
import { adminApi } from '../lib/api';
import { formatStatusForDisplay } from '../lib/status';
import type {
    FeatureFlag,
    FeatureFlagLifecycleStatus,
    FlagConfigStatus,
} from '../lib/types';

type FlagListPageProps = {
    projectKey: string;
    onBackToProjects: () => void;
    onCreateFlag: () => void;
    onEditFlag: (flagKey: string) => void;
    onEditRules: (flagKey: string) => void;
};

type PendingAction = {
    type: 'archive' | 'restore';
    flag: FeatureFlag;
};

type DemoAdminFeature = {
    key: 'coupon-engine' | 'live-support-widget';
    name: string;
    surface: string;
    adminScenario: string;
    rollout: string;
    groupLabel: string;
};

const demoAdminFeatures: DemoAdminFeature[] = [
    {
        key: 'coupon-engine',
        name: 'Coupon Engine',
        surface: 'Demo app cart checkout',
        adminScenario:
            'Controls the automatic AUDIO15 coupon card and checkout discount.',
        rollout: 'Targeted to beta/admin roles plus deterministic percentage rollout.',
        groupLabel: 'Checkout Experience group',
    },
    {
        key: 'live-support-widget',
        name: 'Live Support Widget',
        surface: 'Demo app storefront banner',
        adminScenario:
            'Controls the standalone live support prompt shown above the store.',
        rollout: 'Targeted to beta/admin roles plus a small deterministic rollout.',
        groupLabel: 'Standalone flag (no group)',
    },
];

export function FlagListPage({
    projectKey,
    onBackToProjects,
    onCreateFlag,
    onEditFlag,
    onEditRules,
}: FlagListPageProps) {
    const { can } = useAuth();
    const canManageFlags = can('FLAG_MANAGE');
    const canManageRules = can('RULE_MANAGE');
    const canManageLifecycle = can('FLAG_LIFECYCLE_MANAGE');
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [demoFeatureFlags, setDemoFeatureFlags] = useState<FeatureFlag[]>([]);
    const [search, setSearch] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [status, setStatus] = useState<FlagConfigStatus | ''>('');
    const [lifecycleStatus, setLifecycleStatus] = useState<
        FeatureFlagLifecycleStatus | ''
    >('');
    const [loading, setLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(
        null,
    );

    const loadFlags = useCallback(async () => {
        try {
            const [response, demoFeatureResponse] = await Promise.all([
                adminApi.listFlags(projectKey, {
                    search: submittedSearch,
                    status: status || undefined,
                    lifecycleStatus: lifecycleStatus || undefined,
                    sort: 'updatedAt',
                    order: 'desc',
                    limit: 50,
                }),
                adminApi.listFlags(projectKey, {
                    sort: 'key',
                    order: 'asc',
                    limit: 100,
                }),
            ]);

            setFlags(response.items);
            setDemoFeatureFlags(demoFeatureResponse.items);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load feature flags.',
            );
        } finally {
            setLoading(false);
        }
    }, [projectKey, submittedSearch, status, lifecycleStatus]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadFlags();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadFlags]);

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSubmittedSearch(search.trim());
    }

    async function confirmPendingAction() {
        if (!pendingAction) {
            return;
        }

        setActionBusy(true);

        try {
            if (pendingAction.type === 'archive') {
                await adminApi.archiveFlag(projectKey, pendingAction.flag.key);
            } else {
                await adminApi.restoreFlag(projectKey, pendingAction.flag.key);
            }

            setPendingAction(null);
            await loadFlags();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Flag action failed.',
            );
            setPendingAction(null);
        } finally {
            setActionBusy(false);
        }
    }

    return (
        <section className="page-stack">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Project</p>
                    <h1>Feature flags</h1>
                    <p>
                        Managing flags for <code>{projectKey}</code>. Status
                        labels and runtime state are shown separately.
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={onBackToProjects}
                    >
                        Back to projects
                    </button>

                    <button
                        type="button"
                        className="button button-primary"
                        onClick={onCreateFlag}
                        disabled={!canManageFlags}
                        aria-describedby={
                            !canManageFlags ? 'flag-permission-help' : undefined
                        }
                    >
                        Create flag
                    </button>
                </div>
            </header>

            <DemoFeatureAdminPanel
                flags={demoFeatureFlags}
                canManageFlags={canManageFlags}
                canManageRules={canManageRules}
                onEditFlag={onEditFlag}
                onEditRules={onEditRules}
            />

            <section className="panel">
                {!canManageFlags || !canManageLifecycle ? (
                    <p className="permission-notice" id="flag-permission-help">
                        {canManageFlags
                            ? 'Developers can edit flag configuration and rules. Archive and restore remain administrator-only.'
                            : 'Viewer access is read-only. Flag configuration, rules, archive, and restore actions are disabled.'}
                    </p>
                ) : null}
                <div className="section-header">
                    <div>
                        <h2>Flag list</h2>
                        <p>
                            Filter by configuration status or lifecycle status.
                            Runtime state is derived from lifecycle,
                            configuration, group safety controls, flag safety
                            controls, and serving mode.
                        </p>
                    </div>
                </div>

                <form className="filter-bar" onSubmit={handleSearchSubmit}>
                    <label>
                        Search
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by flag name or key..."
                        />
                    </label>

                    <label>
                        Status label
                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value as FlagConfigStatus | '',
                                )
                            }
                        >
                            <option value="">All statuses</option>
                            <option value="ENABLED">Enabled</option>
                            <option value="DISABLED">Disabled</option>
                        </select>
                    </label>

                    <label>
                        Lifecycle
                        <select
                            value={lifecycleStatus}
                            onChange={(event) =>
                                setLifecycleStatus(
                                    event.target.value as
                                        | FeatureFlagLifecycleStatus
                                        | '',
                                )
                            }
                        >
                            <option value="">All lifecycle states</option>
                            <option value="ACTIVE">Active</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </label>

                    <div className="filter-actions">
                        <button
                            type="submit"
                            className="button button-secondary"
                        >
                            Apply filters
                        </button>
                    </div>
                </form>

                {loading ? (
                    <LoadingState title="Loading feature flags..." />
                ) : null}

                {!loading && error ? (
                    <ErrorState
                        title="Could not load feature flags"
                        description={error}
                        onAction={loadFlags}
                    />
                ) : null}

                {!loading && !error && flags.length === 0 ? (
                    <EmptyState
                        title="No feature flags found"
                        description="Create your first flag for this project."
                        actionLabel={
                            canManageFlags ? 'Create flag' : undefined
                        }
                        onAction={canManageFlags ? onCreateFlag : undefined}
                    />
                ) : null}

                {!loading && !error && flags.length > 0 ? (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Flag</th>
                                    <th scope="col">Status label</th>
                                    <th scope="col">Runtime state</th>
                                    <th scope="col">Group</th>
                                    <th scope="col">Serving</th>
                                    <th scope="col">Flag switch</th>
                                    <th scope="col">Updated</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {flags.map((flag) => (
                                    <tr key={flag.id}>
                                        <td>
                                            <strong>{flag.name}</strong>
                                            <br />
                                            <code>{flag.key}</code>
                                            {flag.description ? (
                                                <p className="table-description">
                                                    {flag.description}
                                                </p>
                                            ) : null}
                                        </td>

                                        <td>
                                            <StatusBadge flag={flag} />
                                        </td>

                                        <td>
                                            <RuntimeStateBadge flag={flag} />
                                        </td>

                                        <td>
                                            {flag.group ? (
                                                <div className="group-cell">
                                                    <strong>
                                                        {flag.group.name}
                                                    </strong>
                                                    <code>
                                                        {flag.group.key}
                                                    </code>
                                                    <span>
                                                        Switch:{' '}
                                                        {flag.group.killSwitch
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="muted">
                                                    No group
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            {formatStatusForDisplay(
                                                flag.servingMode,
                                            )}
                                        </td>

                                        <td>
                                            {flag.killSwitch
                                                ? 'Active'
                                                : 'Inactive'}
                                        </td>

                                        <td>
                                            {new Date(
                                                flag.updatedAt,
                                            ).toLocaleString()}
                                        </td>

                                        <td>
                                            <div className="row-actions">
                                                <button
                                                    type="button"
                                                    className="button button-secondary"
                                                    onClick={() =>
                                                        onEditFlag(flag.key)
                                                    }
                                                    disabled={!canManageFlags}
                                                    title={
                                                        !canManageFlags
                                                            ? 'Viewer access is read-only.'
                                                            : undefined
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button button-secondary"
                                                    onClick={() =>
                                                        onEditRules(flag.key)
                                                    }
                                                    disabled={!canManageRules}
                                                    title={
                                                        !canManageRules
                                                            ? 'Viewer access is read-only.'
                                                            : undefined
                                                    }
                                                >
                                                    Rules
                                                </button>

                                                {flag.lifecycleStatus ===
                                                'ARCHIVED' ? (
                                                    <button
                                                        type="button"
                                                        className="button button-secondary"
                                                        onClick={() =>
                                                            setPendingAction({
                                                                type: 'restore',
                                                                flag,
                                                            })
                                                        }
                                                        disabled={
                                                            !canManageLifecycle
                                                        }
                                                        title={
                                                            !canManageLifecycle
                                                                ? 'Only administrators can restore flags.'
                                                                : undefined
                                                        }
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="button button-danger"
                                                        onClick={() =>
                                                            setPendingAction({
                                                                type: 'archive',
                                                                flag,
                                                            })
                                                        }
                                                        disabled={
                                                            !canManageLifecycle
                                                        }
                                                        title={
                                                            !canManageLifecycle
                                                                ? 'Only administrators can archive flags.'
                                                                : undefined
                                                        }
                                                    >
                                                        Archive
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>

            <ConfirmDialog
                open={pendingAction !== null}
                title={
                    pendingAction?.type === 'archive'
                        ? 'Archive feature flag?'
                        : 'Restore feature flag?'
                }
                description={
                    pendingAction
                        ? pendingAction.type === 'archive'
                            ? `Archive "${pendingAction.flag.key}". Archived flags evaluate Off and remain visible for audit history.`
                            : `Restore "${pendingAction.flag.key}" to active lifecycle status.`
                        : ''
                }
                confirmLabel={
                    pendingAction?.type === 'archive' ? 'Archive' : 'Restore'
                }
                destructive={pendingAction?.type === 'archive'}
                busy={actionBusy}
                onCancel={() => setPendingAction(null)}
                onConfirm={confirmPendingAction}
            />
        </section>
    );
}

type DemoFeatureAdminPanelProps = {
    flags: FeatureFlag[];
    canManageFlags: boolean;
    canManageRules: boolean;
    onEditFlag: (flagKey: string) => void;
    onEditRules: (flagKey: string) => void;
};

function DemoFeatureAdminPanel({
    flags,
    canManageFlags,
    canManageRules,
    onEditFlag,
    onEditRules,
}: DemoFeatureAdminPanelProps) {
    const flagsByKey = new Map(flags.map((flag) => [flag.key, flag]));

    return (
        <section className="panel demo-feature-admin-panel">
            <div className="section-header">
                <div>
                    <p className="eyebrow">Demo features</p>
                    <h2>Checkout and standalone showcase</h2>
                    <p>
                        These seeded flags connect the admin control plane to
                        visible demo-app features for live presentations.
                    </p>
                </div>
            </div>

            <div className="demo-feature-admin-grid">
                {demoAdminFeatures.map((feature) => {
                    const flag = flagsByKey.get(feature.key);

                    return (
                        <article
                            className="demo-feature-admin-card"
                            key={feature.key}
                        >
                            <div className="demo-feature-admin-heading">
                                <div>
                                    <h3>{feature.name}</h3>
                                    <code>{feature.key}</code>
                                </div>
                                <span className="soft-tag">
                                    {feature.surface}
                                </span>
                            </div>

                            <p>{feature.adminScenario}</p>

                            <dl className="meta-list">
                                <div>
                                    <dt>Grouping</dt>
                                    <dd>{feature.groupLabel}</dd>
                                </div>
                                <div>
                                    <dt>Rollout</dt>
                                    <dd>{feature.rollout}</dd>
                                </div>
                            </dl>

                            {flag ? (
                                <>
                                    <div className="badge-row">
                                        <StatusBadge flag={flag} />
                                        <RuntimeStateBadge flag={flag} />
                                    </div>
                                    <div className="row-actions">
                                        <button
                                            type="button"
                                            className="button button-secondary"
                                            onClick={() => onEditFlag(flag.key)}
                                            disabled={!canManageFlags}
                                        >
                                            Edit flag
                                        </button>
                                        <button
                                            type="button"
                                            className="button button-secondary"
                                            onClick={() => onEditRules(flag.key)}
                                            disabled={!canManageRules}
                                        >
                                            Edit rules
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="permission-notice">
                                    Seed this project to create{' '}
                                    <code>{feature.key}</code> before editing.
                                </p>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
