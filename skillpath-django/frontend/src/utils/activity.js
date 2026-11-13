// Local-date key so a step finished at 11pm counts for that calendar day, not UTC's.
export const dayKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// Folds every completed step across all roadmaps into per-day counts + the current streak.
// Steps completed before completedAt existed simply don't count — history starts now.
export const computeActivity = (roadmaps) => {
    const counts = {};
    roadmaps.forEach((rm) =>
        rm.steps.forEach((s) => {
            if (s.completed && s.completedAt) {
                const key = dayKey(s.completedAt);
                counts[key] = (counts[key] || 0) + 1;
            }
        })
    );
    // Streak = consecutive active days ending today — or yesterday, so an
    // unfinished today doesn't break it before the day is over.
    let streak = 0;
    const cursor = new Date();
    if (!counts[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    while (counts[dayKey(cursor)]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return { counts, streak };
};
