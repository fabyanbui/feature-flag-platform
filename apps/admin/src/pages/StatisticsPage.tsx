import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState';
import { adminApi } from '../lib/api';
import { formatStatusForDisplay } from '../lib/status';
import type { FlagStatsSummary } from '../lib/types';

type StatisticsPageProps = {
    projectKey: string;
    onBackToFlags: () => void;
};

type StatisticsFilters = {
    environmentKey: string;
    from: string;
    to: string;
};

const initialFilters: StatisticsFilters = {
    environmentKey: '',
    from: '',
    to: '',
};

export function StatisticsPage({
    projectKey,
    onBackToFlags,
}: StatisticsPageProps) {
    const [items, setItems] = useState<FlagStatsSummary[]>([]);
    const [filters, setFilters] =
        useState<StatisticsFilters>(initialFilters);
    const [submittedFilters, setSubmittedFilters] =
        useState<StatisticsFilters>(initialFilters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStatistics = useCallback(async () => {
        setError(null);

        try {
            const response = await adminApi.listFlagStats(projectKey, {
                environmentKey:
                    submittedFilters.environmentKey.trim() || undefined,
                from: toIsoString(submittedFilters.from),
                to: toIsoString(submittedFilters.to),
                sort: 'totalEvaluations',
                order: 'desc',
                limit: 100,
            });

            setItems(response.items);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Failed to load evaluation statistics.',
            );
        } finally {
            setLoading(false);
        }
    }, [projectKey, submittedFilters]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadStatistics();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadStatistics]);

    const totals = useMemo(
        () =>
            items.reduce(
                (summary, item) => ({
                    total: summary.total + item.totalEvaluations,
                    enabled: summary.enabled + item.enabledCount,
                    disabled: summary.disabled + item.disabledCount,
                }),
                {
                    total: 0,
                    enabled: 0,
                    disabled: 0,
                },
            ),
        [items],
    );

    const enabledPercentage =
        totals.total === 0
            ? 0
            : Math.round((totals.enabled / totals.total) * 10_000) / 100;

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setSubmittedFilters(filters);
    }

    function resetFilters() {
        setFilters(initialFilters);
        setSubmittedFilters(initialFilters);
        setLoading(true);
        setError(null);
    }

    return (
        <section className="page-stack">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Observability</p>
                    <h1>Evaluation statistics</h1>
                    <p>
                        Aggregate evaluation activity for{' '}
                        <code>{projectKey}</code>. Counts represent evaluation
                        requests, not unique users.
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
                        Leave environment empty to use the project default.
                        Empty dates use the backend&apos;s previous-24-hours
                        range.
                    </p>
                </div>

                <form className="stats-filter-grid" onSubmit={handleSubmit}>
                    <label>
                        Environment key
                        <input
                            value={filters.environmentKey}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    environmentKey: event.target.value,
                                }))
                            }
                            placeholder="Default environment"
                        />
                    </label>

                    <label>
                        From
                        <input
                            type="datetime-local"
                            value={filters.from}
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
                            value={filters.to}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    to: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <div className="filter-actions">
                        <button
                            type="submit"
                            className="button button-primary"
                        >
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

            {loading ? (
                <LoadingState title="Loading evaluation statistics..." />
            ) : null}

            {!loading && error ? (
                <ErrorState
                    title="Could not load evaluation statistics"
                    description={error}
                    onAction={() => {
                        setLoading(true);
                        void loadStatistics();
                    }}
                />
            ) : null}

            {!loading && !error && items.length === 0 ? (
                <EmptyState
                    title="No evaluation activity found"
                    description="Run the demo or call the evaluation API, then refresh this dashboard."
                    actionLabel="Refresh statistics"
                    onAction={() => {
                        setLoading(true);
                        void loadStatistics();
                    }}
                />
            ) : null}

            {!loading && !error && items.length > 0 ? (
                <>
                    <section
                        className="stats-summary-grid"
                        aria-label="Evaluation summary"
                    >
                        <SummaryCard
                            label="Total evaluations"
                            value={totals.total}
                            description="Evaluation API requests"
                        />

                        <SummaryCard
                            label="On outcomes"
                            value={totals.enabled}
                            description="Evaluations returning enabled"
                            tone="enabled"
                        />

                        <SummaryCard
                            label="Off outcomes"
                            value={totals.disabled}
                            description="Evaluations returning disabled"
                            tone="disabled"
                        />

                        <SummaryCard
                            label="On percentage"
                            value={`${enabledPercentage}%`}
                            description="Share of evaluations returning On"
                        />
                    </section>

                    <section className="panel">
                        <div className="section-header">
                            <div>
                                <h2>Evaluations by flag</h2>
                                <p>
                                    Runtime outcomes are distinct from flag
                                    configuration and lifecycle status.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="button button-secondary"
                                onClick={() => {
                                    setLoading(true);
                                    void loadStatistics();
                                }}
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="table-wrap">
                            <table className="data-table stats-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Flag</th>
                                        <th scope="col">Total evaluations</th>
                                        <th scope="col">On outcomes</th>
                                        <th scope="col">Off outcomes</th>
                                        <th scope="col">Top reasons</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.flagKey}>
                                            <td>
                                                <code>{item.flagKey}</code>
                                            </td>

                                            <td>
                                                {item.totalEvaluations.toLocaleString()}
                                            </td>

                                            <td>
                                                <span className="outcome-count outcome-count-on">
                                                    On:{' '}
                                                    {item.enabledCount.toLocaleString()}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="outcome-count outcome-count-off">
                                                    Off:{' '}
                                                    {item.disabledCount.toLocaleString()}
                                                </span>
                                            </td>

                                            <td>
                                                <ul className="reason-list">
                                                    {item.topReasons.map(
                                                        (reason) => (
                                                            <li
                                                                key={`${reason.reason}-${reason.enabled}`}
                                                            >
                                                                <span>
                                                                    {formatStatusForDisplay(
                                                                        reason.reason,
                                                                    )}
                                                                </span>
                                                                <span>
                                                                    {reason.enabled
                                                                        ? 'On'
                                                                        : 'Off'}{' '}
                                                                    ·{' '}
                                                                    {reason.count.toLocaleString()}
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            ) : null}
        </section>
    );
}

type SummaryCardProps = {
    label: string;
    value: number | string;
    description: string;
    tone?: 'enabled' | 'disabled';
};

function SummaryCard({
    label,
    value,
    description,
    tone,
}: SummaryCardProps) {
    return (
        <article
            className={[
                'stats-summary-card',
                tone ? `stats-summary-card-${tone}` : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <p>{label}</p>
            <strong>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </strong>
            <span>{description}</span>
        </article>
    );
}

function toIsoString(value: string): string | undefined {
    if (!value) {
        return undefined;
    }

    return new Date(value).toISOString();
}
