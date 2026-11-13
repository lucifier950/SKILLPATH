import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { getRank } from "../../utils/gamification.js";

// Frosted-glass celebration shown when the derived level increases.
// `level` is null when closed — AnimatePresence handles the exit.
function LevelUpModal({ level, onClose }) {
    const reduced = useReducedMotion();
    const rank = level ? getRank(level) : null;

    useEffect(() => {
        if (!level) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        if (!reduced) {
            import("canvas-confetti").then(({ default: confetti }) => {
                confetti({
                    particleCount: 90,
                    spread: 75,
                    origin: { y: 0.6 },
                    colors: ["#f0b429", "#ffd76e", "#fff3c4", "#7396e4"],
                });
            });
        }
        return () => window.removeEventListener("keydown", onKey);
    }, [level, reduced, onClose]);

    return (
        <AnimatePresence>
            {level && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Level ${level} reached`}
                    style={{
                        background: "rgba(10, 14, 34, 0.45)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="sp-glass w-full max-w-sm p-8 text-center"
                        onClick={(e) => e.stopPropagation()}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <motion.div
                            className="text-6xl mb-3"
                            aria-hidden="true"
                            initial={reduced ? false : { scale: 0.3 }}
                            animate={{ scale: reduced ? 1 : [0.3, 1.15, 1] }}
                            transition={{ duration: 0.55, times: [0, 0.7, 1], ease: "easeOut" }}
                        >
                            {rank?.emoji}
                        </motion.div>
                        <p className="sp-glass-eyebrow justify-center">Level up</p>
                        <h2 className="text-3xl font-extrabold mb-1">Level {level}</h2>
                        <p className="text-[var(--neu-text-soft)] mb-6">
                            {rank?.name} rank — keep the streak alive!
                        </p>
                        <button className="sp-glass-btn" onClick={onClose}>
                            Keep learning
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default LevelUpModal;
