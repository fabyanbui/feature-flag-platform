import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import { adminApi } from '../lib/api';
import type {
    EvaluationResult,
    FlagRule,
    RuleInput,
    RuleType,
} from '../lib/types';
import { parseCsv, validatePercentage } from '../lib/validation';

type RuleEditorPageProps = {
    projectKey: string;
    flagKey: string;
    onBackToFlags: () => void;
};

type DraftRule = {
    localId: string;
    type: RuleType;
    priority: number;
    enabled: boolean;
    value: string;
};

type EvaluationForm = {
    targetingKey: string;
    userId: string;
    roles: string;
};

const initialEvaluationForm: EvaluationForm = {
    targetingKey: 'demo-user-beta',
    userId: 'demo-user-beta',
    roles: 'beta-tester',
};

export function RuleEditorPage({
    projectKey,
    flagKey,
    onBackToFlags,
}: RuleEditorPageProps) {
    const [rules, setRules] = useState<DraftRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmBackOpen, setConfirmBackOpen] = useState(false);

    const [evaluationForm, setEvaluationForm] = useState<EvaluationForm>(
        initialEvaluationForm,
    );
    const [evaluating, setEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] =
        useState<EvaluationResult | null>(null);
    const [evaluationError, setEvaluationError] = useState<string | null>(null);

    const sortedRules = useMemo(
        () => [...rules].sort((a, b) => a.priority - b.priority),
        [rules],
    );

    const loadRules = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await adminApi.listRules(projectKey, flagKey, {
                sort: 'priority',
                order: 'asc',
                limit: 100,
            });

            setRules(response.items.map(ruleToDraft));
            setDirty(false);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load rules.',
            );
        } finally {
            setLoading(false);
        }
    }, [projectKey, flagKey]);

    useEffect(() => {
        void loadRules();
    }, [loadRules]);

    function updateRule<Value extends keyof DraftRule>(
        localId: string,
        key: Value,
        value: DraftRule[Value],
    ) {
        setRules((current) =>
            current.map((rule) =>
                rule.localId === localId ? { ...rule, [key]: value } : rule,
            ),
        );
        setDirty(true);
    }

    function addRule(type: RuleType) {
        const maxPriority = rules.reduce(
            (max, rule) => Math.max(max, rule.priority),
            0,
        );

        setRules((current) => [
            ...current,
            {
                localId: crypto.randomUUID(),
                type,
                priority: maxPriority + 10,
                enabled: true,
                value: defaultValueForRuleType(type),
            },
        ]);
        setDirty(true);
    }

    function removeRule(localId: string) {
        setRules((current) => current.filter((rule) => rule.localId !== localId));
        setDirty(true);
    }

    function validateRules(): string | null {
        const seenPriorities = new Set<number>();

        for (const rule of rules) {
            if (seenPriorities.has(rule.priority)) {
                return `Duplicate priority ${rule.priority}. Rule priorities must be unique.`;
            }

            seenPriorities.add(rule.priority);

            if (rule.priority < 0) {
                return 'Rule priority must be 0 or greater.';
            }

            if (rule.type === 'PERCENTAGE_ROLLOUT') {
                const percentage = Number(rule.value);
                const percentageError = validatePercentage(percentage);

                if (percentageError) {
                    return percentageError;
                }
            } else if (parseCsv(rule.value).length === 0) {
                return `${rule.type} requires at least one value.`;
            }
        }

        return null;
    }

    async function handleSave() {
        const validationError = validateRules();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            const payload: RuleInput[] = sortedRules.map(draftToRuleInput);

            await adminApi.replaceRules(projectKey, flagKey, payload);

            setDirty(false);
            await loadRules();
        } catch (requestError) {
            setFormError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to save rules.',
            );
        } finally {
            setSaving(false);
        }
    }

    function handleBack() {
        if (dirty) {
            setConfirmBackOpen(true);
            return;
        }

        onBackToFlags();
    }

    async function handleEvaluate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setEvaluating(true);
        setEvaluationError(null);
        setEvaluationResult(null);

        try {
            const result = await adminApi.evaluateFlag({
                projectKey,
                flagKey,
                context: {
                    targetingKey: evaluationForm.targetingKey.trim() || undefined,
                    userId: evaluationForm.userId.trim() || undefined,
                    roles: parseCsv(evaluationForm.roles),
                },
            });

            setEvaluationResult(result);
        } catch (requestError) {
            setEvaluationError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Evaluation failed.',
            );
        } finally {
            setEvaluating(false);
        }
    }

    if (loading) {
        return (
            <section className="page-stack">
                <LoadingState title="Loading rules..." />
            </section>
        );
    }

    if (error) {
        return (
            <section className="page-stack">
                <ErrorState
                    title="Could not load rules"
                    description={error}
                    onAction={loadRules}
                />
            </section>
        );
    }

    return (
        <section className="page-stack">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Rule editor</p>
                    <h1>Configure targeting rules</h1>
                    <p>
                        Project: <code>{projectKey}</code> / Flag:{' '}
                        <code>{flagKey}</code>
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleBack}
                        disabled={saving}
                    >
                        Back to flags
                    </button>

                    <button
                        type="button"
                        className="button button-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save rules'}
                    </button>
                </div>
            </header>

            <section className="panel">
                <div className="section-header">
                    <div>
                        <h2>Rules</h2>
                        <p>
                            Rules are evaluated by priority. Lower numbers run first within
                            each rule group. If no rule matches, evaluation returns default
                            off.
                        </p>
                    </div>

                    <div className="header-actions">
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => addRule('USER_ALLOWLIST')}
                        >
                            Add allowlist
                        </button>

                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => addRule('ROLE_TARGETING')}
                        >
                            Add role rule
                        </button>

                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => addRule('PERCENTAGE_ROLLOUT')}
                        >
                            Add rollout
                        </button>
                    </div>
                </div>

                {rules.length === 0 ? (
                    <EmptyState
                        title="No targeting rules"
                        description="This flag will fall back to default off unless it is globally enabled."
                    />
                ) : null}

                {sortedRules.length > 0 ? (
                    <div className="rule-list">
                        {sortedRules.map((rule) => (
                            <article className="rule-card" key={rule.localId}>
                                <div className="rule-card-header">
                                    <div>
                                        <h3>{formatRuleType(rule.type)}</h3>
                                        <p>{helpTextForRuleType(rule.type)}</p>
                                    </div>

                                    <label className="switch-field">
                                        <input
                                            type="checkbox"
                                            checked={rule.enabled}
                                            onChange={(event) =>
                                                updateRule(rule.localId, 'enabled', event.target.checked)
                                            }
                                        />
                                        Enabled
                                    </label>
                                </div>

                                <div className="form-grid">
                                    <label>
                                        Priority
                                        <input
                                            type="number"
                                            min={0}
                                            value={rule.priority}
                                            onChange={(event) =>
                                                updateRule(
                                                    rule.localId,
                                                    'priority',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        {labelForRuleValue(rule.type)}
                                        <input
                                            value={rule.value}
                                            onChange={(event) =>
                                                updateRule(rule.localId, 'value', event.target.value)
                                            }
                                            placeholder={placeholderForRuleType(rule.type)}
                                        />
                                    </label>
                                </div>

                                <div className="rule-card-footer">
                                    <button
                                        type="button"
                                        className="button button-danger"
                                        onClick={() => removeRule(rule.localId)}
                                    >
                                        Remove rule
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}

                <div className="fallback-card">
                    <h3>Fallback behavior</h3>
                    <p>
                        If the flag is enabled and targeted, but no allowlist, role, or
                        percentage rollout rule matches, the backend returns:
                    </p>
                    <code>enabled=false, reason=DEFAULT_OFF</code>
                </div>

                {formError ? (
                    <p className="form-error" role="alert">
                        {formError}
                    </p>
                ) : null}
            </section>

            <section className="panel">
                <div>
                    <h2>Test evaluation</h2>
                    <p>
                        Use a sample runtime context to confirm the rule outcome before
                        showing the project in the demo app.
                    </p>
                </div>

                <form className="form-grid" onSubmit={handleEvaluate}>
                    <label>
                        Targeting key
                        <input
                            value={evaluationForm.targetingKey}
                            onChange={(event) =>
                                setEvaluationForm((current) => ({
                                    ...current,
                                    targetingKey: event.target.value,
                                }))
                            }
                            placeholder="demo-user-beta"
                        />
                    </label>

                    <label>
                        User ID
                        <input
                            value={evaluationForm.userId}
                            onChange={(event) =>
                                setEvaluationForm((current) => ({
                                    ...current,
                                    userId: event.target.value,
                                }))
                            }
                            placeholder="demo-user-beta"
                        />
                    </label>

                    <label className="form-grid-full">
                        Roles, comma separated
                        <input
                            value={evaluationForm.roles}
                            onChange={(event) =>
                                setEvaluationForm((current) => ({
                                    ...current,
                                    roles: event.target.value,
                                }))
                            }
                            placeholder="beta-tester, admin"
                        />
                    </label>

                    <div className="form-actions form-grid-full">
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={evaluating}
                        >
                            {evaluating ? 'Evaluating...' : 'Evaluate flag'}
                        </button>
                    </div>
                </form>

                {evaluationError ? (
                    <p className="form-error" role="alert">
                        {evaluationError}
                    </p>
                ) : null}

                {evaluationResult ? (
                    <div className="evaluation-result" role="status" aria-live="polite">
                        <h3>Evaluation result</h3>

                        <dl className="meta-list">
                            <div>
                                <dt>Enabled</dt>
                                <dd>{evaluationResult.enabled ? 'true' : 'false'}</dd>
                            </div>

                            <div>
                                <dt>Variant</dt>
                                <dd>{evaluationResult.variant}</dd>
                            </div>

                            <div>
                                <dt>Reason</dt>
                                <dd>{evaluationResult.reason}</dd>
                            </div>

                            <div>
                                <dt>Matched rule</dt>
                                <dd>{evaluationResult.matchedRuleId ?? 'None'}</dd>
                            </div>
                        </dl>
                    </div>
                ) : null}
            </section>

            <ConfirmDialog
                open={confirmBackOpen}
                title="Discard unsaved rule changes?"
                description="You have unsaved rule changes. If you leave now, those changes will be lost."
                confirmLabel="Discard changes"
                destructive
                busy={false}
                onCancel={() => setConfirmBackOpen(false)}
                onConfirm={onBackToFlags}
            />
        </section>
    );
}

function ruleToDraft(rule: FlagRule): DraftRule {
    return {
        localId: rule.id,
        type: rule.type,
        priority: rule.priority,
        enabled: rule.enabled,
        value: valueFromRule(rule),
    };
}

function valueFromRule(rule: FlagRule): string {
    const parameters = rule.parameters;

    if (rule.type === 'USER_ALLOWLIST') {
        const userIds = Array.isArray(parameters.userIds)
            ? parameters.userIds
            : [];

        return userIds.join(', ');
    }

    if (rule.type === 'ROLE_TARGETING') {
        const roles = Array.isArray(parameters.roles) ? parameters.roles : [];

        return roles.join(', ');
    }

    const percentage =
        typeof parameters.percentage === 'number' ? parameters.percentage : 0;

    return String(percentage);
}

function draftToRuleInput(rule: DraftRule): RuleInput {
    return {
        type: rule.type,
        priority: rule.priority,
        enabled: rule.enabled,
        parameters: parametersForDraftRule(rule),
    };
}

function parametersForDraftRule(rule: DraftRule): Record<string, unknown> {
    if (rule.type === 'USER_ALLOWLIST') {
        return {
            userIds: parseCsv(rule.value),
        };
    }

    if (rule.type === 'ROLE_TARGETING') {
        return {
            roles: parseCsv(rule.value),
        };
    }

    return {
        percentage: Number(rule.value),
    };
}

function defaultValueForRuleType(type: RuleType): string {
    if (type === 'PERCENTAGE_ROLLOUT') {
        return '10';
    }

    if (type === 'ROLE_TARGETING') {
        return 'beta-tester';
    }

    return 'demo-user-beta';
}

function formatRuleType(type: RuleType): string {
    switch (type) {
        case 'USER_ALLOWLIST':
            return 'User allowlist';
        case 'ROLE_TARGETING':
            return 'Role targeting';
        case 'PERCENTAGE_ROLLOUT':
            return 'Percentage rollout';
    }
}

function helpTextForRuleType(type: RuleType): string {
    switch (type) {
        case 'USER_ALLOWLIST':
            return 'Enables the flag for exact user IDs.';
        case 'ROLE_TARGETING':
            return 'Enables the flag when the evaluation context includes a matching role.';
        case 'PERCENTAGE_ROLLOUT':
            return 'Enables the flag for a deterministic percentage of targeting keys.';
    }
}

function labelForRuleValue(type: RuleType): string {
    switch (type) {
        case 'USER_ALLOWLIST':
            return 'User IDs';
        case 'ROLE_TARGETING':
            return 'Roles';
        case 'PERCENTAGE_ROLLOUT':
            return 'Percentage';
    }
}

function placeholderForRuleType(type: RuleType): string {
    switch (type) {
        case 'USER_ALLOWLIST':
            return 'demo-user-beta, demo-user-admin';
        case 'ROLE_TARGETING':
            return 'beta-tester, admin';
        case 'PERCENTAGE_ROLLOUT':
            return '25';
    }
}