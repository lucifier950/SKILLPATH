// XP is fully derived from data we already have (completed steps + streak),
// so there's nothing to persist — it can never drift out of sync.
export const RANKS = [
    { name: "Bronze",   emoji: "🥉", minLevel: 1,  color: "#cd7f32" },
    { name: "Silver",   emoji: "🥈", minLevel: 5,  color: "#9ba3b4" },
    { name: "Gold",     emoji: "🥇", minLevel: 10, color: "#f0b429" },
    { name: "Platinum", emoji: "💎", minLevel: 15, color: "#4cc9c0" },
    { name: "Diamond",  emoji: "👑", minLevel: 20, color: "#7396e4" },
];

export const calculateXP = (roadmaps, streak = 0) => {
    const done = roadmaps.reduce(
        (n, rm) => n + rm.steps.filter((s) => s.completed).length,
        0
    );
    return done * 100 + streak * 25;
};

// Level L spans xp [50·(L-1)², 50·L²) — early levels come fast, later ones slow.
export const getLevel = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;

export const getRank = (level) =>
    [...RANKS].reverse().find((r) => level >= r.minLevel) || RANKS[0];

export const levelProgress = (xp) => {
    const level = getLevel(xp);
    const start = 50 * (level - 1) ** 2;
    const next = 50 * level ** 2;
    return {
        level,
        next,
        toNext: next - xp,
        pct: Math.min(100, Math.round(((xp - start) / (next - start)) * 100)),
    };
};
