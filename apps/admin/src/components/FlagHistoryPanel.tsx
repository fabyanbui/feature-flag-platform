import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../lib/api';
import { formatStatusForDisplay } from '../lib/status';
import type { AuditLog } from '../lib/types';
import { EmptyState, ErrorState, LoadingState } from './DataState';

type FlagHistoryPanelProps = {
    projectKey: string;
    flagKey: string;
    refreshToken?: number;
    onOpenAuditLogs?: () => void;
};

const PAGE_SIZE = 10;

export function FlagHistoryPanel({
    projectKey,
    flagKey,
    refreshToken = 0,
    onOpenAuditLogs,
}: FlagHistoryPanelProps) {
    const [entries, setEntries] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const loadPage = useCallback(
        async (offset: number, replace: boolean) => {
            if (replace) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            setError(null);

            try {
                const response = await adminApi.listFlagHistory(
                    projectKey,
                    flagKey,
                    {
                        limit: PAGE_SIZE,
                        offset,
                        sort: 'createdAt',
                        order: 'desc',
                    },
                );

                setEntries((current) =>
                    replace ? response.items : [...current, ...response.items],
                );
                setHasNext(response.page.hasNext);
                setTotal(response.page.total);
            } catch (requestError) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : 'Failed to load flag history.',
                );
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [projectKey, flagKey],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadPage(0, true);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadPage, refreshToken]);

    function refresh() {
        void loadPage(0, true);
    }

    function loadOlder() {
        void loadPage(entries.length, false);
    }

    return (
        <section className="panel" aria-labelledby="flag-history-heading">
            <div className="section-header">
                <div>
                    <h2 id="flag-history-heading">Configuration history</h2>
                    <p>
                        Audit-backed changes for <code>{flagKey}</code>. Newest
                        changes appear first.
                    </p>
                </div>

                <div className="header-actions">
                    {onOpenAuditLogs ? (
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={onOpenAuditLogs}
                        >
                            View all audit logs
                        </button>
                    ) : null}

                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={refresh}
                        disabled={loading || loadingMore}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <LoadingState title="Loading configuration history..." />
            ) : null}

            {!loading && error && entries.length === 0 ? (
                <ErrorState
                    title="Could not load configuration history"
                    description={error}
                    onAction={refresh}
                />
            ) : null}

            {!loading && !error && entries.length === 0 ? (
                <EmptyState
                    title="No configuration history"
                    description="Configuration changes for this flag will appear here."
                />
            ) : null}

            {!loading && entries.length > 0 ? (
                <>
                    <div className="audit-list">
                        {entries.map((entry) => (
                            <HistoryEntry key={entry.id} entry={entry} />
                        ))}
                    </div>

                    {error ? (
                        <p className="form-error" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <div className="history-pagination">
                        <p aria-live="polite">
                            Showing {entries.length} of {total} changes.
                        </p>

                        {hasNext ? (
                            <button
                                type="button"
                                className="button button-secondary"
                                onClick={loadOlder}
                                disabled={loadingMore}
                            >
                                {loadingMore
                                    ? 'Loading older changes...'
                                    : 'Load older changes'}
                            </button>
                        ) : null}
                    </div>
                </>
            ) : null}
        </section>
    );
}

function HistoryEntry({ entry }: { entry: AuditLog }) {
    return (
        <article className="audit-card">
            <div className="audit-card-header">
                <div>
                    <h3>{formatStatusForDisplay(entry.action)}</h3>
                    <p>{summarizeHistoryEntry(entry)}</p>
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
                    <dt>Target</dt>
                    <dd>
                        {formatStatusForDisplay(entry.targetType)}
                        {entry.targetKey ? (
                            <>
                                {' '}
                                <code>{entry.targetKey}</code>
                            </>
                        ) : null}
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
    );
}

function summarizeHistoryEntry(entry: AuditLog): string {
    switch (entry.action) {
        case 'FEATURE_FLAG_CREATED':
            return 'Feature flag and its default configuration were created.';

        case 'FEATURE_FLAG_ARCHIVED':
            return 'Feature flag was archived and will evaluate Off.';

        case 'FEATURE_FLAG_RESTORED':
            return 'Feature flag was restored to active lifecycle status.';

        case 'FLAG_RULES_REPLACED': {
            const beforeCount = getRuleCount(entry.before);
            const afterCount = getRuleCount(entry.after);

            return `Targeting rules replaced: ${beforeCount} → ${afterCount}.`;
        }

        case 'FEATURE_FLAG_UPDATED': {
            const changes = describeChangedFields(entry.before, entry.after);

            return changes.length > 0
                ? changes.join(' · ')
                : 'Feature flag configuration was updated.';
        }

        default:
            return `${formatStatusForDisplay(entry.targetType)} configuration changed.`;
    }
}

function describeChangedFields(before: unknown, after: unknown): string[] {
    const beforeRecord = asRecord(before);
    const afterRecord = asRecord(after);

    const fields = [
        ['name', 'Name'],
        ['lifecycleStatus', 'Lifecycle'],
        ['status', 'Status'],
        ['servingMode', 'Serving mode'],
        ['killSwitch', 'Kill switch'],
    ] as const;

    return fields.flatMap(([field, label]) => {
        const beforeValue = beforeRecord?.[field];
        const afterValue = afterRecord?.[field];

        if (
            beforeValue === afterValue ||
            (beforeValue === undefined && afterValue === undefined)
        ) {
            return [];
        }

        return [
            `${label}: ${formatSnapshotValue(beforeValue)} → ${formatSnapshotValue(afterValue)}`,
        ];
    });
}

function getRuleCount(value: unknown): number {
    const record = asRecord(value);
    const rules = record?.rules;

    return Array.isArray(rules) ? rules.length : 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function formatSnapshotValue(value: unknown): string {
    if (value === undefined || value === null) {
        return 'None';
    }

    if (typeof value === 'boolean') {
        return value ? 'On' : 'Off';
    }

    if (typeof value === 'string') {
        return formatStatusForDisplay(value);
    }

    return String(value);
}

function formatJson(value: unknown): string {
    if (value === null || value === undefined) {
        return 'null';
    }

    return JSON.stringify(value, null, 2);
}
