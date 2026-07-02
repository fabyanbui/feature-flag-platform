import { useCallback, useEffect, useState } from 'react';
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

const initialCreateForm = {
    key: '',
    name: '',
};

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
            <header className="page-header">
                <div>
                    <p className="eyebrow">Fast rollback</p>
                    <h1>Flag groups</h1>
                    <p>
                        Group related flags and force them runtime Off together
                        in one environment without changing each flag
                        individually.
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={onOpenAuditLogs}
                    >
                        View group audit logs
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

            <section className="panel">
                <div>
                    <h2>Create group</h2>
                    <p>
                        Membership is project-wide. Kill-switch state is
                        configured per environment.
                    </p>
                </div>
                {!canManageGroups ? (
                    <p className="permission-notice" id="group-permission-help">
                        Only administrators can create or rename groups.
                    </p>
                ) : null}

                <form className="form-grid" onSubmit={handleCreate}>
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
                                    : undefined
                            }
                        />
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
                <div className="section-header">
                    <div>
                        <h2>Group controls</h2>
                        <p>
                            Activating a switch affects every assigned flag in
                            the displayed environment.
                        </p>
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

                {!loading && groups.length > 0 ? (
                    <div className="card-grid">
                        {groups.map((group) => {
                            const busy = busyGroupKey === group.key;

                            return (
                                <article
                                    className="resource-card group-card"
                                    key={group.id}
                                >
                                    <div>
                                        <div className="group-card-heading">
                                            <h3>{group.name}</h3>

                                            <span
                                                className={`badge ${
                                                    group.killSwitch
                                                        ? 'group-switch-active'
                                                        : 'group-switch-inactive'
                                                }`}
                                            >
                                                Group switch:{' '}
                                                {group.killSwitch
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>

                                            <span className="group-key-pill">
                                                {group.key}
                                            </span>
                                        </div>
                                    </div>

                                    <dl className="meta-list group-meta-list">
                                        <div>
                                            <dt>Environment</dt>
                                            <dd>{group.environmentKey}</dd>
                                        </div>
                                        <div>
                                            <dt>Assigned flags</dt>
                                            <dd>{group.assignedFlagCount}</dd>
                                        </div>
                                    </dl>

                                    <label className="group-name-field">
                                        <span>Display name</span>
                                        <input
                                            value={
                                                renameDrafts[group.key] ??
                                                group.name
                                            }
                                            onChange={(event) =>
                                                setRenameDrafts((current) => ({
                                                    ...current,
                                                    [group.key]:
                                                        event.target.value,
                                                }))
                                            }
                                            disabled={busy || !canManageGroups}
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
                                                    busy || !canManageGroups
                                                }
                                                title={
                                                    !canManageGroups
                                                        ? 'Only administrators can rename groups.'
                                                        : undefined
                                                }
                                            >
                                                Save name
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
                                                {group.killSwitch
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
                            ? `All ${pendingSwitch.group.assignedFlagCount} flags assigned to "${pendingSwitch.group.name}" will evaluate Off in ${pendingSwitch.group.environmentKey} until this switch is deactivated.`
                            : `Flags assigned to "${pendingSwitch.group.name}" will return to their normal per-flag evaluation in ${pendingSwitch.group.environmentKey}.`
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
                        ? `Delete "${pendingDelete.group.name}" and cascade-delete its environment-specific group configs. This is only allowed because no flags are assigned.`
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
