type DataStateProps = {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export function LoadingState({ title = 'Loading data...' }: Partial<DataStateProps>) {
    return (
        <section className="state-card" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <h2>{title}</h2>
        </section>
    );
}

export function EmptyState({
    title,
    description,
    actionLabel,
    onAction,
}: DataStateProps) {
    return (
        <section className="state-card">
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
            {actionLabel && onAction ? (
                <button type="button" className="button button-primary" onClick={onAction}>
                    {actionLabel}
                </button>
            ) : null}
        </section>
    );
}

export function ErrorState({
    title,
    description,
    actionLabel = 'Retry',
    onAction,
}: DataStateProps) {
    return (
        <section className="state-card state-card-error" role="alert">
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
            {onAction ? (
                <button type="button" className="button button-secondary" onClick={onAction}>
                    {actionLabel}
                </button>
            ) : null}
        </section>
    );
}