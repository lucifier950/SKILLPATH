import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { BookOpen, ChevronDown, Lock, BookMarked, Sparkles } from "lucide-react";
import { sparkBurst } from "../../utils/reward.js";

// Parent passes key={`${step._id}-${state}`}, so a state change remounts the card
// and `open` re-derives — no state-syncing effect needed. That remount is also
// why the completion sparks render via document.body (see utils/reward.js) and
// why the checkmark draw-in below simply animates on mount.
function StepCard({ step, state, side, onToggle, onExplain }) {
    const [open, setOpen] = useState(state === "current");
    const reduced = useReducedMotion();
    const locked = state === "locked";
    const resourceCount = step.resources?.length || 0;

    const handleToggle = (e) => {
        if (!step.completed) {
            const r = e.currentTarget.getBoundingClientRect();
            sparkBurst(r.left + r.width / 2, r.top + r.height / 2);
        }
        onToggle();
    };

    return (
        <div className={`sp-jrow sp-step sp-side-${side} ${state}`}>
            <button
                className="sp-node"
                disabled={locked}
                onClick={handleToggle}
                title={
                    locked
                        ? "Finish the previous step to unlock"
                        : step.completed
                        ? "Click to un-complete"
                        : "Click to mark complete"
                }
            >
                {step.completed ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <motion.path
                            d="M5 13l4 4L19 7"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
                        />
                    </svg>
                ) : locked ? <Lock size={14} /> : step.stepNumber}
            </button>

            <div className={`sp-jcard p-6 ${state === "current" ? "sp-border-anim" : ""}`}>
                <button
                    type="button"
                    className="w-full text-left"
                    disabled={locked}
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                >
                    <div className="flex items-start justify-between gap-3">
                        <p className="font-bold leading-snug">{step.title}</p>
                        {!locked && (
                            <ChevronDown
                                size={18}
                                className={`shrink-0 mt-0.5 text-[var(--neu-text-soft)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                            />
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold text-[var(--neu-text-soft)]">
                        <span>{step.duration}</span>
                        {resourceCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <BookOpen size={13} /> {resourceCount} resource{resourceCount > 1 ? "s" : ""}
                            </span>
                        )}
                        {state === "current" && (
                            <span className="text-[var(--neu-accent)]">● In progress</span>
                        )}
                    </div>
                </button>

                <AnimatePresence initial={false}>
                    {open && !locked && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                        >
                            <p className="text-sm text-[var(--neu-text-soft)] mt-3">{step.description}</p>
                            {resourceCount > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {step.resources.map((r) => (
                                        <span key={r} className="neu-pressed rounded-full px-3 py-1 text-xs font-medium text-[var(--neu-text-soft)] inline-flex items-center gap-1.5">
                                            <BookMarked size={12} className="text-[var(--neu-accent)]" /> {r}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                {state === "current" && (
                                    <button
                                        onClick={handleToggle}
                                        className="neu-btn-accent px-5 py-2 font-semibold text-sm"
                                    >
                                        Mark complete ✓
                                    </button>
                                )}
                                <button
                                    onClick={() => onExplain(step)}
                                    className="sp-mentor-btn"
                                >
                                    <Sparkles size={14} /> Explain with AI
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default StepCard;
