import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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

export function FlagListPage({
    projectKey,
    onBackToProjects,
    onCreateFlag,
    onEditFlag,
    onEditRules,
}: FlagListPageProps) {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
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
            const response = await adminApi.listFlags(projectKey, {
                search: submittedSearch,
                status: status || undefined,
                lifecycleStatus: lifecycleStatus || undefined,
                sort: 'updatedAt',
                order: 'desc',
                limit: 50,
            });

            setFlags(response.items);
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
                    >
                        Create flag
                    </button>
                </div>
            </header>

            <section className="panel">
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
                        actionLabel="Create flag"
                        onAction={onCreateFlag}
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
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button button-secondary"
                                                    onClick={() =>
                                                        onEditRules(flag.key)
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
