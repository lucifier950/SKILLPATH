import { getRank, levelProgress } from "../../utils/gamification.js";

// Sidebar widget: rank badge, level, and progress toward the next level.
function XPPanel({ xp }) {
    const { level, toNext, pct } = levelProgress(xp);
    const rank = getRank(level);
    return (
        <div className="neu-card p-4 mt-6" aria-label={`Level ${level}, ${rank.name} rank, ${xp} XP`}>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl" aria-hidden="true">{rank.emoji}</span>
                <div>
                    <p className="font-bold leading-tight">Level {level}</p>
                    <p className="text-xs font-semibold" style={{ color: rank.color }}>{rank.name}</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-[var(--neu-text-soft)]">{xp} XP</span>
            </div>
            <div className="sp-progress-track">
                <div className="sp-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-[var(--neu-text-soft)] mt-2">
                {toNext} XP to level {level + 1}
            </p>
        </div>
    );
}

export default XPPanel;
