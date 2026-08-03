import { useId } from "react";

// The S-trail mark: a dotted path winding from the green start dot to the
// goal star, tracing a soft "S". Gradient picks up the theme accent.
function Logo({ size = 32 }) {
    const gid = useId();
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
            <defs>
                <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" style={{ stopColor: "var(--neu-accent)" }} />
                    <stop offset="1" stopColor="#8f6ae0" />
                </linearGradient>
            </defs>
            <path
                d="M8 26 C20 24 24 20 16 16 C8 12 12 8 24 6"
                stroke={`url(#${gid})`}
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="0.1 5.2"
            />
            <circle cx="8" cy="26" r="3" fill="#4cc98a" />
            <path
                d="M24 6 l1 2.2 2.4 .3 -1.8 1.7 .5 2.4 -2.1 -1.2 -2.1 1.2 .5 -2.4 -1.8 -1.7 2.4 -.3z"
                fill={`url(#${gid})`}
            />
        </svg>
    );
}

export default Logo;
