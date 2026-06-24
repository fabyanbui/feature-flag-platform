import { useEffect, useRef } from 'react';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open) {
            cancelButtonRef.current?.focus();
        }
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <div className="dialog-backdrop" role="presentation">
            <section
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && !busy) {
                        onCancel();
                    }
                }}
            >
                <h2 id="confirm-dialog-title">{title}</h2>
                <p id="confirm-dialog-description">{description}</p>

                <div className="dialog-actions">
                    <button
                        type="button"
                        ref={cancelButtonRef}
                        className="button button-secondary"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        className={
                            destructive
                                ? 'button button-danger'
                                : 'button button-primary'
                        }
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? 'Working...' : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}
