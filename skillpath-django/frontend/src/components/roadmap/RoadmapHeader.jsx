import { Sparkles, Gauge, Clock, CalendarDays } from "lucide-react";
import ProgressRing from "./ProgressRing.jsx";

const QUOTES = [
    "Small steps, taken consistently, outrun talent.",
    "You don't need more time — you need the next step.",
    "Every expert was once exactly where you are.",
    "Momentum beats motivation. Unlock the next step.",
    "The best time to start was yesterday. The second best is this step.",
];

function RoadmapHeader({ roadmap, done, total, pct }) {
    // stable quote per roadmap, not random — avoids re-shuffling on every render
    const quote = QUOTES[(roadmap.goal.length + total) % QUOTES.length];

    const badges = [
        { icon: <Sparkles size={14} />, label: "AI Generated" },
        { icon: <Gauge size={14} />, label: roadmap.level, cap: true },
        { icon: <Clock size={14} />, label: roadmap.estimatedDuration },
        { icon: <CalendarDays size={14} />, label: `${roadmap.weeklyHours}h / week` },
    ];

    return (
        <div className="neu-card p-8 mb-10 relative overflow-hidden">
            <div className="sp-aurora" aria-hidden="true"><span /><span /><span /></div>
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
                <div className="min-w-0">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight neu-gradient-text capitalize mb-3">
                        {roadmap.goal}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {badges.map((b) => (
                            <span
                                key={b.label}
                                className={`neu-pressed rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--neu-text-soft)] inline-flex items-center gap-1.5 ${b.cap ? "capitalize" : ""}`}
                            >
                                <span className="text-[var(--neu-accent)]">{b.icon}</span>
                                {b.label}
                            </span>
                        ))}
                    </div>
                    <p className="text-sm italic text-[var(--neu-text-soft)]">"{quote}"</p>
                </div>
                <div className="flex sm:flex-col items-center gap-2">
                    <ProgressRing pct={pct} />
                    <p className="text-xs font-semibold text-[var(--neu-text-soft)]">{done}/{total} steps</p>
                </div>
            </div>
        </div>
    );
}

export default RoadmapHeader;
