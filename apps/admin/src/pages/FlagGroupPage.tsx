import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/useAuth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import { adminApi } from '../lib/api';
import type { FlagGroup } from '../lib/types';
import { validateKey, validateRequired } from '../lib/validation';

type FlagGroupPageProps = {
    projectKey: string;
    onBackToFlags: () => void;
    onOpenAuditLogs: () => void;
};

type PendingSwitch = {
    group: FlagGroup;
    nextValue: boolean;
};

type PendingDelete = {
    group: FlagGroup;
};

type GroupSwitchFilter = 'all' | 'active' | 'inactive';

const initialCreateForm = {
    key: '',
    name: '',
};

const initialFilters = {
    search: '',
    switchState: 'all' as GroupSwitchFilter,
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
    return count === 1 ? singular : plural;
}

export function FlagGroupPage({
    projectKey,
    onBackToFlags,
    onOpenAuditLogs,
}: FlagGroupPageProps) {
    const { can } = useAuth();
    const canManageGroups = can('GROUP_MANAGE');
    const canManageKillSwitch = can('GROUP_KILL_SWITCH');
    const [groups, setGroups] = useState<FlagGroup[]>([]);
    const [createForm, setCreateForm] = useState(initialCreateForm);
    const [filters, setFilters] = useState(initialFilters);
    const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>(
        {},
    );
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [busyGroupKey, setBusyGroupKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(
        null,
    );
    const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
        null,
    );

    const loadGroups = useCallback(async () => {
        try {
            const response = await adminApi.listFlagGroups(projectKey, {
                environmentKey: 'production',
                sort: 'createdAt',
                order: 'desc',
                limit: 100,
            });

            setGroups(response.items);
            setRenameDrafts(
                Object.fromEntries(
                    response.items.map((group) => [group.key, group.name]),
                ),
            );
            setError(null);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load flag groups.',
            );
        } finally {
            setLoading(false);
        }
    }, [projectKey]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadGroups();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadGroups]);

    const groupSummary = useMemo(() => {
        const activeSwitchCount = groups.filter(
            (group) => group.killSwitch,
        ).length;
        const assignedFlagCount = groups.reduce(
            (total, group) => total + group.assignedFlagCount,
            0,
        );

        return {
            totalGroups: groups.length,
            activeSwitchCount,
            assignedFlagCount,
        };
    }, [groups]);

    const filteredGroups = useMemo(() => {
        const searchTerm = filters.search.trim().toLowerCase();

        return groups.filter((group) => {
            const matchesSearch =
                searchTerm.length === 0 ||
                group.name.toLowerCase().includes(searchTerm) ||
                group.key.toLowerCase().includes(searchTerm);
            const matchesSwitchState =
                filters.switchState === 'all' ||
                (filters.switchState === 'active'
                    ? group.killSwitch
                    : !group.killSwitch);

            return matchesSearch && matchesSwitchState;
        });
    }, [filters, groups]);

    function resetFilters() {
        setFilters(initialFilters);
    }

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canManageGroups) {
            setFormError('Only administrators can create flag groups.');
            return;
        }

        const validationError =
            validateKey(createForm.key) ??
            validateRequired(createForm.name, 'Group name');

        if (validationError) {
            setFormError(validationError);
            return;
        }

        setCreating(true);
        setFormError(null);

        try {
            await adminApi.createFlagGroup(projectKey, {
                key: createForm.key.trim(),
                name: createForm.name.trim(),
            });
            setCreateForm(initialCreateForm);
            await loadGroups();
        } catch (requestError) {
            setFormError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to create flag group.',
            );
        } finally {
            setCreating(false);
        }
    }

    async function handleRename(group: FlagGroup) {
        const name = renameDrafts[group.key]?.trim() ?? '';
        const validationError = validateRequired(name, 'Group name');

        if (validationError) {
            setError(validationError);
            return;
        }

        if (name === group.name) {
            return;
        }

        setBusyGroupKey(group.key);
        setError(null);

        try {
            await adminApi.updateFlagGroup(projectKey, group.key, name);
            await loadGroups();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to rename flag group.',
            );
        } finally {
            setBusyGroupKey(null);
        }
    }

    async function confirmSwitchChange() {
        if (!pendingSwitch) {
            return;
        }

        setBusyGroupKey(pendingSwitch.group.key);
        setError(null);

        try {
            await adminApi.updateFlagGroupConfig(
                projectKey,
                pendingSwitch.group.key,
                {
                    environmentKey: pendingSwitch.group.environmentKey,
                    killSwitch: pendingSwitch.nextValue,
                },
            );
            setPendingSwitch(null);
            await loadGroups();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to update the group kill switch.',
            );
            setPendingSwitch(null);
        } finally {
            setBusyGroupKey(null);
        }
    }

    async function confirmDelete() {
        if (!pendingDelete) {
            return;
        }

        setBusyGroupKey(pendingDelete.group.key);
        setError(null);

        try {
            await adminApi.deleteFlagGroup(projectKey, pendingDelete.group.key);
            setPendingDelete(null);
            await loadGroups();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to delete flag group.',
            );
            setPendingDelete(null);
        } finally {
            setBusyGroupKey(null);
        }
    }

    return (
        <section className="page-stack">
            <header className="page-header groups-page-header">
                <div>
                    <p className="eyebrow">Fast rollback</p>
                    <h1>Groups</h1>
                    <p>
                        Coordinate related flags with a project-wide group and
                        a shared kill switch. Runtime Off from a group is shown
                        separately from each flag lifecycle status.
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={onOpenAuditLogs}
                    >
                        View audit logs
                    </button>

                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={onBackToFlags}
                    >
                        Back to flags
                    </button>
                </div>
            </header>

            <section
                className="group-overview-grid"
                aria-label="Group rollback overview"
            >
                <article className="group-overview-card">
                    <span>Total groups</span>
                    <strong>{groupSummary.totalGroups}</strong>
                    <p>Rollback collections in this project.</p>
                </article>

                <article className="group-overview-card group-overview-card-danger">
                    <span>Active switches</span>
                    <strong>{groupSummary.activeSwitchCount}</strong>
                    <p>Groups currently forcing assigned flags Off.</p>
                </article>

                <article className="group-overview-card">
                    <span>Assigned flags</span>
                    <strong>{groupSummary.assignedFlagCount}</strong>
                    <p>Flags protected by group rollback.</p>
                </article>

            </section>

            <section className="panel group-create-panel">
                <div className="section-header">
                    <div>
                        <h2>Create rollback group</h2>
                        <p>
                            Use stable, non-PII group keys. Membership stays
                            project-wide while the emergency switch stays
                            separate from each flag configuration.
                        </p>
                    </div>
                </div>
                {!canManageGroups ? (
                    <p className="permission-notice" id="group-permission-help">
                        Only administrators can create, rename, or delete
                        groups. Developers may assign flags from the flag form
                        when permitted; viewers remain read-only.
                    </p>
                ) : null}

                <form
                    className="form-grid group-create-form"
                    onSubmit={handleCreate}
                >
                    <label>
                        Group key
                        <input
                            value={createForm.key}
                            onChange={(event) =>
                                setCreateForm((current) => ({
                                    ...current,
                                    key: event.target.value,
                                }))
                            }
                            placeholder="checkout"
                            disabled={creating || !canManageGroups}
                            aria-describedby={
                                !canManageGroups
                                    ? 'group-permission-help'
                                    : 'group-key-help'
                            }
                        />
                        <span className="field-help" id="group-key-help">
                            Lowercase letters, numbers, and dashes; for example
                            <code>checkout</code>.
                        </span>
                    </label>

                    <label>
                        Group name
                        <input
                            value={createForm.name}
                            onChange={(event) =>
                                setCreateForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="Checkout flags"
                            disabled={creating || !canManageGroups}
                        />
                    </label>

                    {formError ? (
                        <p className="form-error form-grid-full" role="alert">
                            {formError}
                        </p>
                    ) : null}

                    <div className="form-actions form-grid-full">
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={creating || !canManageGroups}
                        >
                            {creating ? 'Creating...' : 'Create group'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="panel">
                {!canManageKillSwitch ? (
                    <p className="permission-notice" id="switch-permission-help">
                        Group kill switches are emergency controls available
                        only to administrators.
                    </p>
                ) : null}
                <div className="section-toolbar group-controls-toolbar">
                    <div>
                        <h2>Group controls</h2>
                        <p>
                            Activating a switch affects every assigned flag in
                            every assigned flag and returns runtime Off with
                            reason <code>GROUP_KILL_SWITCH</code>.
                        </p>
                    </div>

                    <div className="group-results-summary" aria-live="polite">
                        Showing {filteredGroups.length} of {groups.length}{' '}
                        {pluralize(groups.length, 'group')}
                    </div>
                </div>

                <div
                    className="group-filter-bar"
                    role="search"
                    aria-label="Filter flag groups"
                >
                    <label>
                        Search groups
                        <input
                            value={filters.search}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    search: event.target.value,
                                }))
                            }
                            placeholder="Search by group name or key..."
                        />
                    </label>

                    <label>
                        Switch state
                        <select
                            value={filters.switchState}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    switchState: event.target
                                        .value as GroupSwitchFilter,
                                }))
                            }
                        >
                            <option value="all">All switches</option>
                            <option value="active">Active only</option>
                            <option value="inactive">Inactive only</option>
                        </select>
                    </label>

                    <div className="filter-actions">
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={resetFilters}
                        >
                            Reset filters
                        </button>
                    </div>
                </div>

                {loading ? (
                    <LoadingState title="Loading flag groups..." />
                ) : null}

                {!loading && error ? (
                    <ErrorState
                        title="Could not complete the group action"
                        description={error}
                        onAction={loadGroups}
                    />
                ) : null}

                {!loading && !error && groups.length === 0 ? (
                    <EmptyState
                        title="No flag groups"
                        description="Create a group to coordinate rollback for related flags."
                    />
                ) : null}

                {!loading &&
                !error &&
                groups.length > 0 &&
                filteredGroups.length === 0 ? (
                    <EmptyState
                        title="No groups match these filters"
                        description="Adjust the search text or switch-state filter to show more groups."
                        actionLabel="Reset filters"
                        onAction={resetFilters}
                    />
                ) : null}

                {!loading && !error && filteredGroups.length > 0 ? (
                    <div className="card-grid group-card-grid">
                        {filteredGroups.map((group) => {
                            const busy = busyGroupKey === group.key;
                            const draftName =
                                renameDrafts[group.key] ?? group.name;
                            const nameChanged =
                                draftName.trim() !== group.name;

                            return (
                                <article
                                    className={`resource-card group-card ${
                                        group.killSwitch
                                            ? 'group-card-switch-active'
                                            : ''
                                    }`}
                                    key={group.id}
                                >
                                    <div className="group-card-main">
                                        <div className="group-card-heading">
                                            <div>
                                                <span className="group-key-pill">
                                                    {group.key}
                                                </span>
                                                <h3>{group.name}</h3>
                                            </div>

                                            <span
                                                className={`badge ${
                                                    group.killSwitch
                                                        ? 'group-switch-active'
                                                        : 'group-switch-inactive'
                                                }`}
                                                role="status"
                                                aria-label={`Group kill switch is ${
                                                    group.killSwitch
                                                        ? 'active'
                                                        : 'inactive'
                                                }`}
                                            >
                                                Switch{' '}
                                                {group.killSwitch
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </div>

                                        <p
                                            className={
                                                group.killSwitch
                                                    ? 'group-runtime-note group-runtime-note-off'
                                                    : 'group-runtime-note'
                                            }
                                        >
                                            {group.killSwitch
                                                ? 'Runtime Off override is active for assigned flags.'
                                                : 'No group override: assigned flags follow their own status, rules, and flag switch.'}
                                        </p>
                                    </div>

                                    <dl className="meta-list group-meta-list">
                                        <div>
                                            <dt>Assigned flags</dt>
                                            <dd>
                                                {group.assignedFlagCount}{' '}
                                                {pluralize(
                                                    group.assignedFlagCount,
                                                    'flag',
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Runtime reason</dt>
                                            <dd>
                                                {group.killSwitch
                                                    ? 'GROUP_KILL_SWITCH'
                                                    : 'Per-flag evaluation'}
                                            </dd>
                                        </div>
                                    </dl>

                                    <label className="group-name-field">
                                        <span>Display name</span>
                                        <input
                                            value={draftName}
                                            onChange={(event) =>
                                                setRenameDrafts((current) => ({
                                                    ...current,
                                                    [group.key]:
                                                        event.target.value,
                                                }))
                                            }
                                            disabled={busy || !canManageGroups}
                                            aria-label={`Display name for ${group.key}`}
                                        />
                                    </label>

                                    <div className="group-card-actions">
                                        <div className="card-actions group-primary-actions">
                                            <button
                                                type="button"
                                                className="button button-secondary"
                                                onClick={() =>
                                                    void handleRename(group)
                                                }
                                                disabled={
                                                    busy ||
                                                    !canManageGroups ||
                                                    !nameChanged
                                                }
                                                title={
                                                    !canManageGroups
                                                        ? 'Only administrators can rename groups.'
                                                        : undefined
                                                }
                                            >
                                                {busy
                                                    ? 'Saving...'
                                                    : 'Save name'}
                                            </button>

                                            <button
                                                type="button"
                                                className={
                                                    group.killSwitch
                                                        ? 'button button-secondary'
                                                        : 'button button-danger'
                                                }
                                                onClick={() =>
                                                    setPendingSwitch({
                                                        group,
                                                        nextValue:
                                                            !group.killSwitch,
                                                    })
                                                }
                                                disabled={
                                                    busy ||
                                                    !canManageKillSwitch
                                                }
                                                aria-describedby={
                                                    !canManageKillSwitch
                                                        ? 'switch-permission-help'
                                                        : undefined
                                                }
                                            >
                                                {busy
                                                    ? 'Updating...'
                                                    : group.killSwitch
                                                      ? 'Deactivate switch'
                                                      : 'Activate switch'}
                                            </button>
                                        </div>

                                        <div className="group-delete-action">
                                            <button
                                                type="button"
                                                className="button button-danger"
                                                onClick={() =>
                                                    setPendingDelete({ group })
                                                }
                                                disabled={
                                                    busy ||
                                                    !canManageGroups ||
                                                    group.assignedFlagCount > 0
                                                }
                                                title={
                                                    group.assignedFlagCount > 0
                                                        ? 'Unassign all flags before deleting this group.'
                                                        : !canManageGroups
                                                          ? 'Only administrators can delete groups.'
                                                          : undefined
                                                }
                                            >
                                                Delete group
                                            </button>
                                            {group.assignedFlagCount > 0 ? (
                                                <small className="group-action-hint">
                                                    Unassign all flags before
                                                    deleting.
                                                </small>
                                            ) : !canManageGroups ? (
                                                <small className="group-action-hint">
                                                    Delete is administrator-only.
                                                </small>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : null}
            </section>

            <ConfirmDialog
                open={pendingSwitch !== null}
                title={
                    pendingSwitch?.nextValue
                        ? 'Activate group kill switch?'
                        : 'Deactivate group kill switch?'
                }
                description={
                    pendingSwitch
                        ? pendingSwitch.nextValue
                            ? `All ${pendingSwitch.group.assignedFlagCount} flags assigned to "${pendingSwitch.group.name}" will evaluate Off until this switch is deactivated.`
                            : `Flags assigned to "${pendingSwitch.group.name}" will return to their normal per-flag evaluation.`
                        : ''
                }
                confirmLabel={
                    pendingSwitch?.nextValue
                        ? 'Activate kill switch'
                        : 'Deactivate switch'
                }
                destructive={pendingSwitch?.nextValue}
                busy={busyGroupKey !== null}
                onCancel={() => setPendingSwitch(null)}
                onConfirm={confirmSwitchChange}
            />

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete flag group?"
                description={
                    pendingDelete
                        ? `Delete "${pendingDelete.group.name}". This is only allowed because no flags are assigned.`
                        : ''
                }
                confirmLabel="Delete group"
                destructive
                busy={busyGroupKey !== null}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
            />
        </section>
    );
}
