type TimeRangeValue = {
    from: string;
    to: string;
};

type TimeRangeShortcutsProps = {
    onChange: (range: TimeRangeValue) => void;
};

const minuteInMilliseconds = 60 * 1000;
const hourInMilliseconds = 60 * minuteInMilliseconds;
const dayInMilliseconds = 24 * hourInMilliseconds;

export function TimeRangeShortcuts({ onChange }: TimeRangeShortcutsProps) {
    function applyRelativeRange(durationInMilliseconds: number) {
        const now = new Date();
        onChange({
            from: toLocalDateTimeValue(
                new Date(now.getTime() - durationInMilliseconds),
            ),
            to: toLocalDateTimeValue(now),
        });
    }

    function applyTodayRange() {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        onChange({
            from: toLocalDateTimeValue(startOfToday),
            to: toLocalDateTimeValue(now),
        });
    }

    return (
        <fieldset className="time-range-shortcuts">
            <legend>Quick time range</legend>
            <div>
                <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => applyRelativeRange(hourInMilliseconds)}
                >
                    Last hour
                </button>
                <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => applyRelativeRange(dayInMilliseconds)}
                >
                    Last 24h
                </button>
                <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => applyRelativeRange(7 * dayInMilliseconds)}
                >
                    Last 7 days
                </button>
                <button
                    type="button"
                    className="button button-secondary"
                    onClick={applyTodayRange}
                >
                    Today
                </button>
                <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => onChange({ from: '', to: '' })}
                >
                    Clear dates
                </button>
            </div>
        </fieldset>
    );
}

function toLocalDateTimeValue(date: Date): string {
    const offsetDate = new Date(
        date.getTime() - date.getTimezoneOffset() * minuteInMilliseconds,
    );

    return offsetDate.toISOString().slice(0, 16);
}
