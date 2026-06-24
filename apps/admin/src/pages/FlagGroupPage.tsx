import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import { adminApi } from '../lib/api';
import type { FlagGroup } from '../lib/types';
import { validateKey, validateRequired } from '../lib/validation';

type FlagGroupPageProps = {
    projectKey: string;
    onBackToFlags: () => void;
};

type PendingSwitch = {
    group: FlagGroup;
    nextValue: boolean;
};

const initialCreateForm = {
    key: '',
    name: '',
};

export function FlagGroupPage({
    projectKey,
    onBackToFlags,
}: FlagGroupPageProps) {
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
                            disabled={creating}
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
                            disabled={creating}
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
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Create group'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="panel">
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
                                            <div>
                                                <h3>{group.name}</h3>
                                                <p className="muted">
                                                    <code>{group.key}</code>
                                                </p>
                                            </div>

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
                                        </div>
                                    </div>

                                    <dl className="meta-list">
                                        <div>
                                            <dt>Environment</dt>
                                            <dd>{group.environmentKey}</dd>
                                        </div>
                                        <div>
                                            <dt>Assigned flags</dt>
                                            <dd>{group.assignedFlagCount}</dd>
                                        </div>
                                    </dl>

                                    <label>
                                        Display name
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
                                            disabled={busy}
                                        />
                                    </label>

                                    <div className="card-actions">
                                        <button
                                            type="button"
                                            className="button button-secondary"
                                            onClick={() =>
                                                void handleRename(group)
                                            }
                                            disabled={busy}
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
                                            disabled={busy}
                                        >
                                            {group.killSwitch
                                                ? 'Deactivate switch'
                                                : 'Activate kill switch'}
                                        </button>
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
        </section>
    );
}
