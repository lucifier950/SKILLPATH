import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/useAuth.js";
import { API_URL } from "../../api.js";
import { getTheme, applyTheme } from "../../utils/theme.js";

// subsequence fuzzy match: every query char appears in order
const fuzzy = (q, text) => {
    q = q.toLowerCase();
    text = text.toLowerCase();
    let i = 0;
    for (const ch of text) if (ch === q[i]) i++;
    return i === q.length;
};

function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const [roadmaps, setRoadmaps] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                // reset search state on every toggle so opening is always fresh
                setQuery("");
                setActive(0);
                setOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // the navbar search pill opens the palette for mouse/touch users
    useEffect(() => {
        const onOpen = () => {
            setQuery("");
            setActive(0);
            setOpen(true);
        };
        window.addEventListener("sp-cmdk-open", onOpen);
        return () => window.removeEventListener("sp-cmdk-open", onOpen);
    }, []);

    // opening focuses the input and pulls a fresh roadmap list for jump-to
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => inputRef.current?.focus(), 30);
        if (user) {
            fetch(`${API_URL}/api/roadmaps`, { credentials: "include" })
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => setRoadmaps(Array.isArray(data) ? data : []))
                .catch(() => {});
        }
        return () => clearTimeout(t);
    }, [open, user]);

    const close = useCallback(() => setOpen(false), []);

    const groups = useMemo(() => {
        const go = (to, state) => () => navigate(to, state ? { state } : undefined);
        const list = [];
        if (user && roadmaps.length) {
            list.push({
                title: "🎯 Roadmaps",
                items: roadmaps.map((rm) => ({
                    id: `rm-${rm._id}`,
                    label: rm.goal,
                    hint: `${rm.steps.filter((s) => s.completed).length}/${rm.steps.length} steps`,
                    run: go("/roadmap", { selectId: rm._id }),
                })),
            });
        }
        list.push({
            title: "⚡ Actions",
            items: [
                {
                    id: "new-roadmap",
                    label: "Create new roadmap",
                    hint: user ? undefined : "sign in first",
                    run: user ? go("/roadmap", { newRoadmap: true }) : go("/login"),
                },
                {
                    id: "toggle-theme",
                    label: `Switch to ${getTheme() === "dark" ? "light" : "dark"} mode`,
                    run: () => applyTheme(getTheme() === "dark" ? "light" : "dark"),
                },
            ],
        });
        list.push({
            title: "📍 Go to",
            items: [
                { id: "nav-home", label: "Home", run: go("/") },
                { id: "nav-roadmap", label: "My roadmaps", run: user ? go("/roadmap") : go("/login") },
                { id: "nav-about", label: "About", run: go("/about") },
                { id: "nav-contact", label: "Contact", run: go("/contact") },
            ],
        });
        return list;
    }, [user, roadmaps, navigate]);

    const filtered = useMemo(() => {
        const q = query.trim();
        return groups
            .map((g) => ({ ...g, items: q ? g.items.filter((c) => fuzzy(q, c.label)) : g.items }))
            .filter((g) => g.items.length);
    }, [groups, query]);

    const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);
    const activeIdx = Math.min(active, Math.max(0, flat.length - 1));
    const activeId = flat[activeIdx]?.id;

    const runItem = (item) => {
        close();
        item.run();
    };

    const onInputKey = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, flat.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === "Enter" && flat[activeIdx]) {
            e.preventDefault();
            runItem(flat[activeIdx]);
        } else if (e.key === "Escape") {
            close();
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[18vh]"
                    style={{
                        background: "rgba(10, 14, 34, 0.4)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={close}
                >
                    <motion.div
                        className="sp-glass w-full max-w-lg overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Command palette"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.97, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActive(0);
                            }}
                            onKeyDown={onInputKey}
                            placeholder="Search roadmaps, actions, pages…"
                            className="w-full bg-transparent border-none outline-none px-5 py-4 text-[var(--neu-text)] placeholder-[var(--neu-text-soft)] border-b"
                            role="combobox"
                            aria-expanded="true"
                            aria-controls="sp-cmd-list"
                            aria-activedescendant={activeId}
                        />
                        <div className="sp-cmd-divider" />
                        <div id="sp-cmd-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
                            {flat.length === 0 && (
                                <p className="px-3 py-6 text-center text-sm text-[var(--neu-text-soft)]">
                                    No matches — try a different search.
                                </p>
                            )}
                            {filtered.map((group) => (
                                <div key={group.title}>
                                    <p className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--neu-text-soft)]">
                                        {group.title}
                                    </p>
                                    {group.items.map((item) => (
                                        <button
                                            key={item.id}
                                            id={item.id}
                                            role="option"
                                            aria-selected={item.id === activeId}
                                            className="sp-cmd-item w-full flex items-baseline justify-between gap-3 text-left rounded-lg px-3 py-2.5 text-sm font-medium"
                                            onMouseEnter={() => setActive(flat.indexOf(item))}
                                            onClick={() => runItem(item)}
                                        >
                                            <span className="capitalize truncate">{item.label}</span>
                                            {item.hint && (
                                                <span className="shrink-0 text-xs text-[var(--neu-text-soft)]">{item.hint}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="sp-cmd-divider" />
                        <p className="px-4 py-2.5 text-[11px] text-[var(--neu-text-soft)]">
                            ↑↓ navigate · ↵ select · esc close
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CommandPalette;
