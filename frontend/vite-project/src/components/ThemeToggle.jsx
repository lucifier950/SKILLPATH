import { useEffect, useState } from "react";

const getInitialTheme = () => {
    // index.html sets data-theme before first paint — trust it as the source of truth
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
};

function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem("sp-theme", theme);
        } catch {
            // private mode — theme just won't persist
        }
    }, [theme]);

    const dark = theme === "dark";
    return (
        <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            className="p-2 rounded-xl text-[var(--neu-text-soft)] hover:text-[var(--neu-accent)] active:scale-90 transition-all"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {dark ? (
                    <>
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                    </>
                ) : (
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                )}
            </svg>
        </button>
    );
}

export default ThemeToggle;
