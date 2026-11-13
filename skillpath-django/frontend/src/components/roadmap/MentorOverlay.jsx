import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Sparkles, RotateCcw } from "lucide-react";
import { API_URL } from "../../api.js";

// Renders the mentor's small markdown subset: ## headings, "- " bullets, **bold**, `code`, [links](https://…).
const LINK = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/;

// AI-written links: YouTube searches are kept as-is; any other site is cut to its homepage,
// because models sometimes guess deep links that 404. Only http(s) URLs ever become links.
const safeHref = (raw) => {
    try {
        const url = new URL(raw.trim().replace(/\s+/g, "+"));
        return url.hostname.endsWith("youtube.com") ? url.href : `${url.origin}/`;
    } catch {
        return null;
    }
};

const renderInline = (text) =>
    text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).filter(Boolean).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
        const link = part.match(LINK);
        const href = link && safeHref(link[2]);
        if (href) {
            return (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="sp-mentor-link">
                    {link[1]} ↗
                </a>
            );
        }
        return part;
    });

const renderMarkdown = (text) => {
    const blocks = [];
    let list = null;
    const flushList = (key) => {
        if (list) {
            blocks.push(<ul key={`ul-${key}`}>{list}</ul>);
            list = null;
        }
    };
    text.split("\n").forEach((line, i) => {
        const t = line.trim();
        if (t.startsWith("- ") || t.startsWith("* ")) {
            list = list || [];
            list.push(<li key={i}>{renderInline(t.slice(2))}</li>);
            return;
        }
        flushList(i);
        if (!t) return;
        if (t.startsWith("#")) blocks.push(<h4 key={i}>{renderInline(t.replace(/^#+\s*/, ""))}</h4>);
        else blocks.push(<p key={i}>{renderInline(t)}</p>);
    });
    flushList("end");
    return blocks;
};

const STATUS_LINE = {
    thinking: "Reading your roadmap…",
    streaming: "Explaining…",
    done: "Your mentor's take",
    error: "The mentor couldn't answer",
};

// Quick-action lenses — each re-asks the mentor with a different angle.
const MODES = [
    { id: "explain", label: "✨ Deep dive" },
    { id: "simplify", label: "🧒 Simplify" },
    { id: "example", label: "💻 Practical example" },
    { id: "analogy", label: "🎯 Analogy" },
];

// Parent passes key={step._id}, so switching steps remounts and state re-derives from the cache.
function MentorOverlay({ roadmap, step, cache, onCached, onClose }) {
    const [mode, setMode] = useState("explain");
    const cacheKey = `${step._id}:${mode}`;
    const [text, setText] = useState(() => cache[`${step._id}:explain`] || "");
    const [status, setStatus] = useState(() => (cache[`${step._id}:explain`] ? "done" : "thinking"));
    const [attempt, setAttempt] = useState(0);

    const switchMode = (next) => {
        if (next === mode) return;
        setMode(next);
        const cached = cache[`${step._id}:${next}`];
        setText(cached || "");
        setStatus(cached ? "done" : "thinking");
    };

    // Esc closes, and the page behind the overlay stays put
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    useEffect(() => {
        if (cache[cacheKey]) return;
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/roadmaps/${roadmap._id}/steps/${step._id}/explain`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ mode }),
                    signal: ctrl.signal,
                });
                if (!res.ok) throw new Error("Request failed");
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let full = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split("\n\n");
                    buffer = events.pop();
                    for (const raw of events) {
                        if (!raw.startsWith("data: ")) continue;
                        const event = JSON.parse(raw.slice(6));
                        if (event.type === "chunk") {
                            full += event.text;
                            setText(full);
                            setStatus("streaming");
                        } else if (event.type === "done") {
                            onCached(cacheKey, full);
                            setStatus("done");
                        } else if (event.type === "error") {
                            throw new Error(event.message);
                        }
                    }
                }
            } catch (err) {
                if (err.name !== "AbortError") setStatus("error");
            }
        })();
        return () => ctrl.abort();
    }, [roadmap._id, step._id, mode, cacheKey, cache, onCached, attempt]);

    const retry = () => {
        setText("");
        setStatus("thinking");
        setAttempt((a) => a + 1);
    };

    return (
        <motion.div
            className="sp-mentor-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            <motion.div
                className="sp-mentor-panel"
                role="dialog"
                aria-modal="true"
                aria-label={`AI mentor deep dive: ${step.title}`}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 48, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
                <button type="button" className="sp-mentor-close" onClick={onClose} aria-label="Close deep dive">
                    <X size={18} />
                </button>

                <div className="sp-mentor-head">
                    <div className={`sp-orb ${status}`} aria-hidden="true">
                        <span className="sp-orb-core" />
                    </div>
                    <div className="min-w-0">
                        <p className="sp-mentor-eyebrow">
                            <Sparkles size={12} /> Step {step.stepNumber} · Deep dive
                        </p>
                        <h3 className="sp-mentor-title">{step.title}</h3>
                        <p className="sp-mentor-status" aria-live="polite">{STATUS_LINE[status]}</p>
                    </div>
                </div>

                <div className="sp-mentor-actions" aria-label="Ask the mentor differently">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            aria-pressed={mode === m.id}
                            onClick={() => switchMode(m.id)}
                            className="sp-mentor-mode"
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                <div className="sp-mentor-body">
                    {status === "error" ? (
                        <div className="sp-mentor-error">
                            <p>Couldn't reach the AI mentor. Check your connection and try again.</p>
                            <button type="button" className="neu-btn-accent px-4 py-2 text-sm font-semibold inline-flex items-center gap-2" onClick={retry}>
                                <RotateCcw size={14} /> Try again
                            </button>
                        </div>
                    ) : (
                        <>
                            {renderMarkdown(text)}
                            {status !== "done" && <span className="sp-caret" aria-hidden="true" />}
                        </>
                    )}
                    {status === "done" && step.resources?.length > 0 && (
                        <div className="sp-mentor-resources">
                            <p className="sp-mentor-resources-title">📚 Look these up (opens a web search)</p>
                            <div className="flex flex-wrap gap-2">
                                {step.resources.map((r) => (
                                    <a
                                        key={r}
                                        href={`https://www.google.com/search?q=${encodeURIComponent(`${r} ${roadmap.goal}`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="sp-mentor-resource"
                                    >
                                        {r} ↗
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default MentorOverlay;
