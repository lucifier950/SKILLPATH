import { motion } from "motion/react";
import StepCard from "./StepCard.jsx";

function JourneyTimeline({ roadmap, onToggleStep, onExplain }) {
    const total = roadmap.steps.length;
    const done = roadmap.steps.filter((s) => s.completed).length;
    const currentIdx = roadmap.steps.findIndex((s) => !s.completed);
    // fill reaches the current node, so "where I am" and the glow line up
    const fillPct = total ? Math.min(100, ((done + 0.5) / total) * 100) : 0;

    return (
        <div className="sp-journey">
            <div className="sp-spine" aria-hidden="true">
                <div className="sp-spine-fill" style={{ height: `${done === total ? 100 : fillPct}%` }} />
            </div>
            {roadmap.steps.map((step, i) => {
                const state = step.completed ? "completed" : i === currentIdx ? "current" : "locked";
                return (
                    <motion.div
                        key={`${step._id}-${state}`}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
                    >
                        <StepCard
                            step={step}
                            state={state}
                            side={i % 2 === 0 ? "left" : "right"}
                            onToggle={() => onToggleStep(roadmap._id, step._id)}
                            onExplain={onExplain}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}

export default JourneyTimeline;
