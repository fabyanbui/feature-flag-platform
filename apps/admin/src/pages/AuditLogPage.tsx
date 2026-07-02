import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import { TimeRangeShortcuts } from '../components/TimeRangeShortcuts';
import { adminApi } from '../lib/api';
import { formatStatusForDisplay } from '../lib/status';
import type { AuditLog } from '../lib/types';

type AuditFilters = {
    targetType: string;
    targetKey: string;
    actor: string;
    action: string;
    from: string;
    to: string;
};

const defaultFilters: AuditFilters = {
    targetType: '',
    targetKey: '',
    actor: '',
    action: '',
    from: '',
    to: '',
};

export type AuditLogInitialFilters = Partial<AuditFilters>;

type AuditLogPageProps = {
    projectKey: string;
    onBackToFlags: () => void;
    initialFilters?: AuditLogInitialFilters;
};

function createInitialFilters(
    initialFilters?: AuditLogInitialFilters,
): AuditFilters {
    return {
        ...defaultFilters,
        ...initialFilters,
    };
}

const targetTypeOptions = [
    'PROJECT',
    'ENVIRONMENT',
    'FEATURE_FLAG',
    'FLAG_GROUP',
    'FLAG_CONFIG',
    'FLAG_RULE',
    'SAMPLE_USER',
];

const actionOptions = [
    'PROJECT_CREATED',
    'PROJECT_UPDATED',
    'PROJECT_DELETED',
    'ENVIRONMENT_CREATED',
    'ENVIRONMENT_UPDATED',
    'ENVIRONMENT_DELETED',
    'FEATURE_FLAG_CREATED',
    'FEATURE_FLAG_UPDATED',
    'FEATURE_FLAG_ARCHIVED',
    'FEATURE_FLAG_RESTORED',
    'FEATURE_FLAG_DELETED',
    'FEATURE_FLAG_GROUP_ASSIGNED',
    'FEATURE_FLAG_GROUP_UNASSIGNED',
    'FLAG_GROUP_CREATED',
    'FLAG_GROUP_UPDATED',
    'FLAG_GROUP_DELETED',
    'FLAG_GROUP_KILL_SWITCH_UPDATED',
    'FLAG_CONFIG_CREATED',
    'FLAG_CONFIG_UPDATED',
    'FLAG_CONFIG_DELETED',
    'FLAG_RULE_CREATED',
    'FLAG_RULE_UPDATED',
    'FLAG_RULE_DELETED',
    'FLAG_RULES_REPLACED',
    'SAMPLE_USER_CREATED',
    'SAMPLE_USER_DELETED',
];

export function AuditLogPage({
    projectKey,
    onBackToFlags,
    initialFilters,
}: AuditLogPageProps) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filters, setFilters] = useState<AuditFilters>(() =>
        createInitialFilters(initialFilters),
    );
    const [submittedFilters, setSubmittedFilters] = useState<AuditFilters>(() =>
        createInitialFilters(initialFilters),
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAuditLogs = useCallback(async () => {
        setError(null);

        try {
            const response = await adminApi.listAuditLogs(projectKey, {
                targetType: submittedFilters.targetType || undefined,
                targetKey: submittedFilters.targetKey.trim() || undefined,
                actor: submittedFilters.actor.trim() || undefined,
                action: submittedFilters.action || undefined,
                from: toIsoString(submittedFilters.from),
                to: toIsoString(submittedFilters.to),
                sort: 'createdAt',
                order: 'desc',
                limit: 50,
            });

            setLogs(response.items);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load audit logs.',
            );
        } finally {
            setLoading(false);
        }
    }, [projectKey, submittedFilters]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadAuditLogs();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadAuditLogs]);

    function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSubmittedFilters({ ...filters });
    }

    function resetFilters() {
        setLoading(true);
        setError(null);
        const nextFilters = createInitialFilters();
        setFilters(nextFilters);
        setSubmittedFilters({ ...nextFilters });
    }

    return (
        <section className="page-stack">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Auditability</p>
                    <h1>Audit logs</h1>
                    <p>
                        Project: <code>{projectKey}</code>. Review who changed what, when,
                        and with before/after snapshots.
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
                    <h2>Filters</h2>
                    <p>
                        Filter by target, actor, action, or time range. Audit entries are
                        append-only and generated by backend mutation transactions.
                    </p>
                </div>

                <form className="audit-filter-grid" onSubmit={handleFilterSubmit}>
                    <label>
                        Target type
                        <select
                            value={filters.targetType}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    targetType: event.target.value,
                                }))
                            }
                        >
                            <option value="">All target types</option>
                            {targetTypeOptions.map((targetType) => (
                                <option key={targetType} value={targetType}>
                                    {formatStatusForDisplay(targetType)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Target key
                        <input
                            value={filters.targetKey}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    targetKey: event.target.value,
                                }))
                            }
                            placeholder="new-checkout"
                        />
                    </label>

                    <label>
                        Actor
                        <input
                            value={filters.actor}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    actor: event.target.value,
                                }))
                            }
                            placeholder="demo-admin, demo-developer, or system"
                        />
                    </label>

                    <label>
                        Action
                        <select
                            value={filters.action}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    action: event.target.value,
                                }))
                            }
                        >
                            <option value="">All actions</option>
                            {actionOptions.map((action) => (
                                <option key={action} value={action}>
                                    {formatStatusForDisplay(action)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        From
                        <input
                            type="datetime-local"
                            step="60"
                            value={filters.from}
                            title="Use the date and time picker or a quick range below."
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    from: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        To
                        <input
                            type="datetime-local"
                            step="60"
                            value={filters.to}
                            title="Use the date and time picker or a quick range below."
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    to: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <TimeRangeShortcuts
                        onChange={(range) =>
                            setFilters((current) => ({
                                ...current,
                                ...range,
                            }))
                        }
                    />

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
            </section>

            <section className="panel">
                <div className="section-toolbar">
                    <div>
                        <h2>Entries</h2>
                        <p>Newest audit entries appear first.</p>
                    </div>

                    <div className="section-toolbar-actions">
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                void loadAuditLogs();
                            }}
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? <LoadingState title="Loading audit logs..." /> : null}

                {!loading && error ? (
                    <ErrorState
                        title="Could not load audit logs"
                        description={error}
                        onAction={loadAuditLogs}
                    />
                ) : null}

                {!loading && !error && logs.length === 0 ? (
                    <EmptyState
                        title="No audit logs found"
                        description="Try changing filters, or create/edit a flag to generate audit entries."
                        actionLabel="Reset filters"
                        onAction={resetFilters}
                    />
                ) : null}

                {!loading && !error && logs.length > 0 ? (
                    <div className="audit-list">
                        {logs.map((entry) => (
                            <article className="audit-card" key={entry.id}>
                                <div className="audit-card-header">
                                    <div>
                                        <h3>{formatStatusForDisplay(entry.action)}</h3>
                                        <p>
                                            <span className="audit-actor-pill">{entry.actor}</span>{' '}
                                            changed {formatStatusForDisplay(entry.targetType)}
                                            {entry.targetKey ? (
                                                <>
                                                    {' '}
                                                    <code>{entry.targetKey}</code>
                                                </>
                                            ) : null}
                                        </p>
                                    </div>

                                    <time dateTime={entry.createdAt}>
                                        {new Date(entry.createdAt).toLocaleString()}
                                    </time>
                                </div>

                                <dl className="meta-list">
                                    <div>
                                        <dt>Actor</dt>
                                        <dd>{entry.actor}</dd>
                                    </div>
                                    <div>
                                        <dt>Target type</dt>
                                        <dd>{formatStatusForDisplay(entry.targetType)}</dd>
                                    </div>
                                    <div>
                                        <dt>Action</dt>
                                        <dd>{formatStatusForDisplay(entry.action)}</dd>
                                    </div>
                                    <div>
                                        <dt>Environment</dt>
                                        <dd>{entry.environmentKey ?? 'None'}</dd>
                                    </div>
                                    <div>
                                        <dt>Request ID</dt>
                                        <dd>
                                            <code>{entry.requestId}</code>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Target ID</dt>
                                        <dd>
                                            <code>{entry.targetId}</code>
                                        </dd>
                                    </div>
                                </dl>

                                <div className="snapshot-grid">
                                    <details>
                                        <summary>Before snapshot</summary>
                                        <pre>{formatJson(entry.before)}</pre>
                                    </details>

                                    <details>
                                        <summary>After snapshot</summary>
                                        <pre>{formatJson(entry.after)}</pre>
                                    </details>

                                    <details>
                                        <summary>Metadata</summary>
                                        <pre>{formatJson(entry.metadata)}</pre>
                                    </details>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </section>
        </section>
    );
}

function toIsoString(value: string): string | undefined {
    if (!value) {
        return undefined;
    }

    return new Date(value).toISOString();
}

function formatJson(value: unknown): string {
    if (value === null || value === undefined) {
        return 'null';
    }

    return JSON.stringify(value, null, 2);
}
