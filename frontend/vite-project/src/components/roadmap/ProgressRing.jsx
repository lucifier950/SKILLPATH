const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ pct }) {
    const offset = CIRCUMFERENCE * (1 - pct / 100);
    return (
        <div className="relative w-24 h-24 shrink-0" role="img" aria-label={`${pct}% complete`}>
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="var(--neu-dark)" strokeOpacity="0.35" strokeWidth="8" />
                <circle
                    cx="48" cy="48" r={RADIUS} fill="none"
                    stroke="url(#sp-ring-grad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }}
                />
                <defs>
                    <linearGradient id="sp-ring-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4cc98a" />
                        <stop offset="100%" stopColor="var(--neu-accent)" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-extrabold text-lg">
                {pct}%
            </span>
        </div>
    );
}

export default ProgressRing;
