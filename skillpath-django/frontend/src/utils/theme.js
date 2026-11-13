// Shared theme contract: index.html sets data-theme before first paint,
// ThemeToggle and the command palette both go through these helpers.
export const getTheme = () =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    try {
        localStorage.setItem("sp-theme", theme);
    } catch {
        // private mode — theme just won't persist
    }
};
