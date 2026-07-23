import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Sparkles, RotateCcw } from "lucide-react";
import { API_URL } from "../../api.js";

// Renders the mentor's small markdown subset: ## headings, "- " bullets, **bold**, `code`.
const renderInline = (text) =>
    text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
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

// Parent passes key={step._id}, so switching steps remounts and state re-derives from the cache.
function MentorOverlay({ roadmap, step, cachedText, onCached, onClose }) {
    const [text, setText] = useState(cachedText || "");
    const [status, setStatus] = useState(cachedText ? "done" : "thinking");
    const [attempt, setAttempt] = useState(0);

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
        if (cachedText) return;
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/roadmaps/${roadmap._id}/steps/${step._id}/explain`, {
                    method: "POST",
                    credentials: "include",
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
                            onCached(step._id, full);
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
    }, [roadmap._id, step._id, cachedText, onCached, attempt]);

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
                </div>
            </motion.div>
        </motion.div>
    );
}

export default MentorOverlay;
