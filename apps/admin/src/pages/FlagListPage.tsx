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
    type: 'archive' | 'delete' | 'restore' | 'restoreDeleted';
    flag: FeatureFlag;
};

type FlagFilters = {
    search: string;
    status: FlagConfigStatus | '';
    lifecycleStatus: FeatureFlagLifecycleStatus | '';
};

const initialFlagFilters: FlagFilters = {
    search: '',
    status: '',
    lifecycleStatus: '',
};

function createInitialFlagFilters(): FlagFilters {
    return { ...initialFlagFilters };
}

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
    const [deletedFlags, setDeletedFlags] = useState<FeatureFlag[]>([]);
    const [filters, setFilters] = useState<FlagFilters>(
        createInitialFlagFilters,
    );
    const [submittedFilters, setSubmittedFilters] = useState<FlagFilters>(
        createInitialFlagFilters,
    );
    const [loading, setLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(
        null,
    );

    const loadFlags = useCallback(async () => {
        try {
            const [response, deletedResponse] = await Promise.all([
                adminApi.listFlags(projectKey, {
                    search: submittedFilters.search,
                    status: submittedFilters.status || undefined,
                    lifecycleStatus:
                        submittedFilters.lifecycleStatus || undefined,
                    sort: 'updatedAt',
                    order: 'desc',
                    limit: 50,
                }),
                adminApi.listDeletedFlags(projectKey, {
                    search: submittedFilters.search,
                    status: submittedFilters.status || undefined,
                    lifecycleStatus:
                        submittedFilters.lifecycleStatus || undefined,
                    sort: 'updatedAt',
                    order: 'desc',
                    limit: 50,
                }),
            ]);

            setFlags(response.items);
            setDeletedFlags(deletedResponse.items);
            setError(null);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load feature flags.',
            );
        } finally {
            setLoading(false);
        }
    }, [projectKey, submittedFilters]);

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
        setSubmittedFilters({
            ...filters,
            search: filters.search.trim(),
        });
    }

    function resetFilters() {
        const nextFilters = createInitialFlagFilters();
        setFilters(nextFilters);
        setSubmittedFilters({ ...nextFilters });
        setLoading(true);
        setError(null);
    }

    async function confirmPendingAction() {
        if (!pendingAction) {
            return;
        }

        setActionBusy(true);

        try {
            if (pendingAction.type === 'delete') {
                await adminApi.deleteFlag(projectKey, pendingAction.flag.key);
            } else if (pendingAction.type === 'archive') {
                await adminApi.archiveFlag(projectKey, pendingAction.flag.key);
            } else if (pendingAction.type === 'restoreDeleted') {
                await adminApi.restoreDeletedFlag(
                    projectKey,
                    pendingAction.flag.key,
                );
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

            <section className="panel">
                {!canManageFlags || !canManageLifecycle ? (
                    <p className="permission-notice" id="flag-permission-help">
                        {canManageFlags
                            ? 'Developers can edit flag configuration and rules. Archive, delete, and restore remain administrator-only.'
                            : 'Viewer access is read-only. Flag configuration, rules, archive, delete, and restore actions are disabled.'}
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
                            value={filters.search}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    search: event.target.value,
                                }))
                            }
                            placeholder="Search by flag name or key..."
                        />
                    </label>

                    <label>
                        Status label
                        <select
                            value={filters.status}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    status: event.target.value as
                                        | FlagConfigStatus
                                        | '',
                                }))
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
                            value={filters.lifecycleStatus}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    lifecycleStatus: event.target.value as
                                        | FeatureFlagLifecycleStatus
                                        | '',
                                }))
                            }
                        >
                            <option value="">All lifecycle states</option>
                            <option value="ACTIVE">Active</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </label>

                    <div className="filter-actions">
                        <button type="submit" className="button button-primary">
                            Apply filters
                        </button>

                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={resetFilters}
                        >
                            Reset
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
                        <table className="data-table flag-table">
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
                                            <div className="flag-row-actions">
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
                                                            setPendingAction(
                                                                {
                                                                    type: 'restore',
                                                                    flag,
                                                                },
                                                            )
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
                                                        className="button button-secondary"
                                                        onClick={() =>
                                                            setPendingAction(
                                                                {
                                                                    type: 'archive',
                                                                    flag,
                                                                },
                                                            )
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

                                                <button
                                                    type="button"
                                                    className="button button-danger"
                                                    onClick={() =>
                                                        setPendingAction({
                                                            type: 'delete',
                                                            flag,
                                                        })
                                                    }
                                                    disabled={
                                                        !canManageLifecycle
                                                    }
                                                    title={
                                                        !canManageLifecycle
                                                            ? 'Only administrators can delete flags.'
                                                            : undefined
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>

            <section className="panel">
                <div className="section-header">
                    <div>
                        <h2>Deleted flags</h2>
                        <p>
                            Soft-deleted flags are hidden from the main dashboard
                            and evaluation path, but can be restored for
                            recovery.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <LoadingState title="Loading deleted feature flags..." />
                ) : null}

                {!loading && !error && deletedFlags.length === 0 ? (
                    <EmptyState
                        title="No deleted feature flags"
                        description="Deleted flags will appear here for recovery."
                    />
                ) : null}

                {!loading && !error && deletedFlags.length > 0 ? (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Flag</th>
                                    <th scope="col">Lifecycle before delete</th>
                                    <th scope="col">Deleted</th>
                                    <th scope="col">Deleted by</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {deletedFlags.map((flag) => (
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
                                            {flag.deletedAt
                                                ? new Date(
                                                      flag.deletedAt,
                                                  ).toLocaleString()
                                                : 'Unknown'}
                                        </td>

                                        <td>{flag.deletedBy ?? 'Unknown'}</td>

                                        <td>
                                            <div className="row-actions">
                                                <button
                                                    type="button"
                                                    className="button button-secondary"
                                                    onClick={() =>
                                                        setPendingAction({
                                                            type: 'restoreDeleted',
                                                            flag,
                                                        })
                                                    }
                                                    disabled={
                                                        !canManageLifecycle
                                                    }
                                                    title={
                                                        !canManageLifecycle
                                                            ? 'Only administrators can restore deleted flags.'
                                                            : undefined
                                                    }
                                                >
                                                    Restore
                                                </button>
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
                    pendingAction?.type === 'delete'
                        ? 'Delete feature flag?'
                        : pendingAction?.type === 'archive'
                          ? 'Archive feature flag?'
                        : pendingAction?.type === 'restoreDeleted'
                          ? 'Restore deleted feature flag?'
                        : 'Restore feature flag?'
                }
                description={
                    pendingAction
                        ? pendingAction.type === 'delete'
                            ? `Delete "${pendingAction.flag.key}" as a soft delete. The flag disappears from the main dashboard and evaluation returns Not Found until it is restored.`
                            : pendingAction.type === 'archive'
                              ? `Archive "${pendingAction.flag.key}". Archived flags stay visible in the dashboard and evaluate Off with FLAG_ARCHIVED.`
                            : pendingAction.type === 'restoreDeleted'
                              ? `Restore "${pendingAction.flag.key}" from the deleted flags table. Its previous lifecycle state is preserved.`
                              : `Restore "${pendingAction.flag.key}" to active lifecycle status.`
                        : ''
                }
                confirmLabel={
                    pendingAction?.type === 'delete'
                        ? 'Delete'
                        : pendingAction?.type === 'archive'
                          ? 'Archive'
                          : 'Restore'
                }
                destructive={
                    pendingAction?.type === 'delete' ||
                    pendingAction?.type === 'archive'
                }
                busy={actionBusy}
                onCancel={() => setPendingAction(null)}
                onConfirm={confirmPendingAction}
            />
        </section>
    );
}
