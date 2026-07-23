import { Compass, TrendingUp, CalendarClock, BookOpen } from "lucide-react";

// Everything shown here is computed from real roadmap data — no invented insights.
function CoachPanel({ roadmap }) {
    const total = roadmap.steps.length;
    const done = roadmap.steps.filter((s) => s.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const current = roadmap.steps.find((s) => !s.completed);
    const next = current ? roadmap.steps[roadmap.steps.indexOf(current) + 1] : null;

    // sum the numeric part of remaining step durations ("2 weeks" → 2); show only if parseable
    const remaining = roadmap.steps.filter((s) => !s.completed);
    const remainingWeeks = remaining.reduce((sum, s) => {
        const m = String(s.duration || "").match(/(\d+(?:\.\d+)?)/);
        return sum === null || !m ? null : sum + Number(m[1]);
    }, 0);

    const dailyMinutes = Math.round((roadmap.weeklyHours * 60) / 7 / 5) * 5;

    return (
        <aside className="flex flex-col gap-5">
            <div className="neu-card p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--neu-accent)] mb-3 inline-flex items-center gap-1.5">
                    <Compass size={14} /> Up next
                </p>
                {current ? (
                    <>
                        <p className="font-bold leading-snug">{current.title}</p>
                        <p className="text-sm text-[var(--neu-text-soft)] mt-1">{current.duration}</p>
                        {current.resources?.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-semibold text-[var(--neu-text-soft)] mb-2 inline-flex items-center gap-1">
                                    <BookOpen size={12} /> Start with
                                </p>
                                <ul className="text-sm text-[var(--neu-text-soft)] space-y-1">
                                    {current.resources.slice(0, 3).map((r) => (
                                        <li key={r} className="truncate">· {r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="font-bold text-[var(--sp-success-text)]">All steps complete! 🎉</p>
                )}
            </div>

            <div className="neu-card p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--neu-accent)] mb-3 inline-flex items-center gap-1.5">
                    <TrendingUp size={14} /> Progress insights
                </p>
                <ul className="text-sm text-[var(--neu-text-soft)] space-y-2">
                    <li><span className="font-bold text-[var(--neu-text)]">{pct}%</span> of this roadmap complete</li>
                    <li><span className="font-bold text-[var(--neu-text)]">{total - done}</span> step{total - done !== 1 ? "s" : ""} remaining</li>
                    {remainingWeeks !== null && remainingWeeks > 0 && (
                        <li>≈ <span className="font-bold text-[var(--neu-text)]">{remainingWeeks} week{remainingWeeks !== 1 ? "s" : ""}</span> to go at your pace</li>
                    )}
                    {next && <li>Next milestone: <span className="font-bold text-[var(--neu-text)]">{next.title}</span></li>}
                </ul>
            </div>

            <div className="neu-card p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--neu-accent)] mb-3 inline-flex items-center gap-1.5">
                    <CalendarClock size={14} /> Your pace
                </p>
                <p className="text-sm text-[var(--neu-text-soft)]">
                    <span className="font-bold text-[var(--neu-text)]">{roadmap.weeklyHours}h/week</span> ≈ a
                    <span className="font-bold text-[var(--neu-text)]"> {dailyMinutes}-minute</span> session most days.
                    Consistency beats cramming.
                </p>
            </div>
        </aside>
    );
}

export default CoachPanel;
