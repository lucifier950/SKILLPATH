import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";

const getInitialTheme = () => {
    // index.html sets data-theme before first paint — trust it as the source of truth
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
};

function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme);
    const btnRef = useRef(null);
    const maskId = useId();

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem("sp-theme", theme);
        } catch {
            // private mode — theme just won't persist
        }
    }, [theme]);

    const dark = theme === "dark";

    const toggle = () => {
        const next = dark ? "light" : "dark";
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Fallback: no View Transitions support, or the user asked for less
        // motion — plain swap; the theme colors still cross-fade via CSS.
        if (!document.startViewTransition || reduced) {
            setTheme(next);
            return;
        }

        const { top, left, width, height } = btnRef.current.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        // radius to the farthest viewport corner so the circle always covers everything
        const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        // Freeze per-element color transitions during the snapshot swap so the
        // reveal shows the finished theme, not a mid-fade frame.
        document.documentElement.classList.add("sp-vt");
        const transition = document.startViewTransition(() => {
            flushSync(() => setTheme(next));
            document.documentElement.dataset.theme = next;
        });
        transition.ready
            .then(() => {
                document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${radius}px at ${x}px ${y}px)`,
                        ],
                    },
                    {
                        duration: 500,
                        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                        pseudoElement: "::view-transition-new(root)",
                    }
                );
            })
            .catch(() => {});
        transition.finished.finally(() => {
            document.documentElement.classList.remove("sp-vt");
        });
    };

    return (
        <button
            ref={btnRef}
            type="button"
            onClick={toggle}
            className="sp-theme-toggle p-2 rounded-xl text-[var(--neu-text-soft)] hover:text-[var(--neu-accent)] active:scale-90 transition-all"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
        >
            {/* One SVG for both states: the mask circle slides in to carve the
                crescent while the rays retract — so sun morphs into moon. */}
            <svg
                className="sp-tt"
                data-dark={dark || undefined}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <mask id={maskId}>
                    <rect width="24" height="24" fill="#fff" />
                    <circle className="sp-tt-bite" cx={dark ? 17 : 28} cy={dark ? 7 : -4} r="8" fill="#000" />
                </mask>
                <circle
                    className="sp-tt-core"
                    cx="12"
                    cy="12"
                    r={dark ? 8.5 : 4.5}
                    mask={`url(#${maskId})`}
                    fill="currentColor"
                />
                <g className="sp-tt-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </g>
            </svg>
        </button>
    );
}

export default ThemeToggle;
