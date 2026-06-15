import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState, LoadingState } from '../components/DataState';
import { RuntimeStateBadge } from '../components/RuntimeStateBadge';
import { StatusBadge } from '../components/StatusBadge';
import { adminApi } from '../lib/api';
import type { FeatureFlag, FlagConfigStatus, ServingMode } from '../lib/types';
import { validateKey, validateRequired } from '../lib/validation';

type FlagFormProps = {
    projectKey: string;
    flagKey: string | null;
    onCancel: () => void;
    onSaved: () => void;
};

type FlagFormState = {
    key: string;
    name: string;
    description: string;
    status: FlagConfigStatus;
    servingMode: ServingMode;
    killSwitch: boolean;
};

const initialForm: FlagFormState = {
    key: '',
    name: '',
    description: '',
    status: 'DISABLED',
    servingMode: 'TARGETED',
    killSwitch: false,
};

export function FlagForm({
    projectKey,
    flagKey,
    onCancel,
    onSaved,
}: FlagFormProps) {
    const isEditing = flagKey !== null;

    const [form, setForm] = useState<FlagFormState>(initialForm);
    const [loadedFlag, setLoadedFlag] = useState<FeatureFlag | null>(null);
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    const loadFlag = useCallback(async () => {
        if (!flagKey) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const flag = await adminApi.getFlag(projectKey, flagKey);

            setLoadedFlag(flag);
            setForm({
                key: flag.key,
                name: flag.name,
                description: flag.description ?? '',
                status: flag.status,
                servingMode: flag.servingMode,
                killSwitch: flag.killSwitch,
            });
            setDirty(false);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load feature flag.',
            );
        } finally {
            setLoading(false);
        }
    }, [projectKey, flagKey]);

    useEffect(() => {
        void loadFlag();
    }, [loadFlag]);

    const previewFlag = useMemo<FeatureFlag | null>(() => {
        if (!loadedFlag) {
            return null;
        }

        return {
            ...loadedFlag,
            name: form.name,
            description: form.description || null,
            status: form.status,
            servingMode: form.servingMode,
            killSwitch: form.killSwitch,
        };
    }, [form, loadedFlag]);

    function updateForm<Value extends keyof FlagFormState>(
        key: Value,
        value: FlagFormState[Value],
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
        setDirty(true);
    }

    function validateForm(): string | null {
        if (!isEditing) {
            const keyError = validateKey(form.key);

            if (keyError) {
                return keyError;
            }
        }

        return validateRequired(form.name, 'Flag name');
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            if (isEditing && flagKey) {
                await adminApi.updateFlag(projectKey, flagKey, {
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                    status: form.status,
                    servingMode: form.servingMode,
                    killSwitch: form.killSwitch,
                });
            } else {
                const created = await adminApi.createFlag(projectKey, {
                    key: form.key.trim(),
                    name: form.name.trim(),
                    description: form.description.trim() || undefined,
                });

                await adminApi.updateFlag(projectKey, created.key, {
                    status: form.status,
                    servingMode: form.servingMode,
                    killSwitch: form.killSwitch,
                });
            }

            setDirty(false);
            onSaved();
        } catch (requestError) {
            setFormError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to save feature flag.',
            );
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        if (dirty) {
            setConfirmCancelOpen(true);
            return;
        }

        onCancel();
    }

    if (loading) {
        return (
            <section className="page-stack">
                <LoadingState title="Loading feature flag..." />
            </section>
        );
    }

    if (error) {
        return (
            <section className="page-stack">
                <ErrorState
                    title="Could not load feature flag"
                    description={error}
                    onAction={loadFlag}
                />
            </section>
        );
    }

    return (
        <section className="page-stack">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Feature flag</p>
                    <h1>{isEditing ? 'Edit flag' : 'Create flag'}</h1>
                    <p>
                        Project: <code>{projectKey}</code>. Status label and runtime state
                        are handled separately.
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                </div>
            </header>

            <section className="panel">
                <form className="form-grid" onSubmit={handleSubmit}>
                    <label>
                        Flag key
                        <input
                            value={form.key}
                            onChange={(event) => updateForm('key', event.target.value)}
                            placeholder="new-checkout"
                            disabled={isEditing || saving}
                        />
                    </label>

                    <label>
                        Flag name
                        <input
                            value={form.name}
                            onChange={(event) => updateForm('name', event.target.value)}
                            placeholder="New Checkout"
                            disabled={saving}
                        />
                    </label>

                    <label className="form-grid-full">
                        Description
                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                updateForm('description', event.target.value)
                            }
                            placeholder="Controls rollout of the new checkout experience."
                            rows={4}
                            disabled={saving}
                        />
                    </label>

                    <label>
                        Status label
                        <select
                            value={form.status}
                            onChange={(event) =>
                                updateForm('status', event.target.value as FlagConfigStatus)
                            }
                            disabled={saving}
                        >
                            <option value="DISABLED">Disabled</option>
                            <option value="ENABLED">Enabled</option>
                        </select>
                    </label>

                    <label>
                        Serving mode
                        <select
                            value={form.servingMode}
                            onChange={(event) =>
                                updateForm('servingMode', event.target.value as ServingMode)
                            }
                            disabled={saving}
                        >
                            <option value="TARGETED">Targeted / conditional</option>
                            <option value="GLOBAL_ON">Global on</option>
                        </select>
                    </label>

                    <label className="checkbox-field form-grid-full">
                        <input
                            type="checkbox"
                            checked={form.killSwitch}
                            onChange={(event) =>
                                updateForm('killSwitch', event.target.checked)
                            }
                            disabled={saving}
                        />
                        <span>
                            Kill switch active — force runtime Off even when status is
                            Enabled.
                        </span>
                    </label>

                    {previewFlag ? (
                        <div className="status-preview form-grid-full">
                            <h2>Preview</h2>
                            <p>
                                This preview shows how the flag will be labeled in the flag
                                list.
                            </p>
                            <div className="badge-row">
                                <StatusBadge flag={previewFlag} />
                                <RuntimeStateBadge flag={previewFlag} />
                            </div>
                        </div>
                    ) : null}

                    {!isEditing ? (
                        <div className="status-preview form-grid-full">
                            <h2>Create default behavior</h2>
                            <p>
                                New flags are created as safe-by-default. The form then saves
                                the selected status, serving mode, and kill switch settings.
                            </p>
                        </div>
                    ) : null}

                    {formError ? (
                        <p className="form-error form-grid-full" role="alert">
                            {formError}
                        </p>
                    ) : null}

                    <div className="form-actions form-grid-full">
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create flag'}
                        </button>
                    </div>
                </form>
            </section>

            <ConfirmDialog
                open={confirmCancelOpen}
                title="Discard unsaved changes?"
                description="You have unsaved flag changes. If you leave now, those changes will be lost."
                confirmLabel="Discard changes"
                destructive
                busy={false}
                onCancel={() => setConfirmCancelOpen(false)}
                onConfirm={onCancel}
            />
        </section>
    );
}