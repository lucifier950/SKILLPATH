import { Flame } from "lucide-react";
import { dayKey } from "../../utils/activity.js";

const WEEKS = 12;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const heatLevel = (n) => (n >= 3 ? 3 : n); // 0, 1, 2, 3+

// GitHub-style heatmap: columns are weeks (Mon-start), last column is this week.
function ActivityPanel({ counts, streak }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    // back to this week's Monday, then 11 more weeks back
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7 * (WEEKS - 1));

    const weeks = [];
    for (let w = 0; w < WEEKS; w++) {
        const days = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(start);
            date.setDate(start.getDate() + w * 7 + d);
            days.push(date);
        }
        weeks.push(days);
    }

    const totalDone = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="neu-card p-4 mt-6">
            <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm font-bold">Activity</p>
                <p className={`inline-flex items-center gap-1 text-sm font-bold ${streak > 0 ? "text-[var(--neu-accent)]" : "text-[var(--neu-text-soft)]"}`}>
                    <Flame size={15} className={streak > 0 ? "sp-flame" : ""} /> {streak} day{streak === 1 ? "" : "s"}
                </p>
            </div>
            <div className="sp-heatmap" role="img" aria-label={`Activity for the last ${WEEKS} weeks: ${totalDone} steps completed, current streak ${streak} days`}>
                {weeks.map((days, w) =>
                    days.map((date, d) => {
                        if (date > today) return <span key={`${w}-${d}`} className="sp-heat-cell sp-heat-future" />;
                        const n = counts[dayKey(date)] || 0;
                        return (
                            <span
                                key={`${w}-${d}`}
                                className={`sp-heat-cell sp-heat-${heatLevel(n)}`}
                                title={`${n} step${n === 1 ? "" : "s"} · ${date.getDate()} ${MONTHS[date.getMonth()]}`}
                            />
                        );
                    })
                )}
            </div>
            <p className="text-xs text-[var(--neu-text-soft)] mt-3">
                {totalDone > 0
                    ? `${totalDone} step${totalDone === 1 ? "" : "s"} in the last ${WEEKS} weeks`
                    : "Complete a step today to start your streak"}
            </p>
        </div>
    );
}

export default ActivityPanel;
