import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig, AnimatePresence } from "motion/react";
import RoadmapHeader from "./RoadmapHeader.jsx";
import JourneyTimeline from "./JourneyTimeline.jsx";
import CoachPanel from "./CoachPanel.jsx";
import MentorOverlay from "./MentorOverlay.jsx";

function RoadmapView({ roadmap, onToggleStep }) {
    const total = roadmap.steps.length;
    const done = roadmap.steps.filter((s) => s.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const prevPct = useRef(pct);
    const [mentorStep, setMentorStep] = useState(null);
    // explanations are cached per step so reopening a deep dive is instant (and free)
    const [explanations, setExplanations] = useState({});
    const cacheExplanation = useCallback((stepId, text) => {
        setExplanations((prev) => ({ ...prev, [stepId]: text }));
    }, []);

    // one celebration, at the one moment it's earned — lazy-loaded so confetti
    // never touches the main bundle
    useEffect(() => {
        if (pct === 100 && prevPct.current < 100 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            import("canvas-confetti").then(({ default: confetti }) => {
                confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
            });
        }
        prevPct.current = pct;
    }, [pct]);

    return (
        <MotionConfig reducedMotion="user">
            <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-8 items-start">
                <div className="min-w-0">
                    <RoadmapHeader roadmap={roadmap} done={done} total={total} pct={pct} />
                    <JourneyTimeline roadmap={roadmap} onToggleStep={onToggleStep} onExplain={setMentorStep} />
                    {total > 0 && done === total && (
                        <div className="sp-complete-banner">
                            🎉 Roadmap complete! You've mastered <span className="capitalize font-bold">{roadmap.goal}</span>.
                        </div>
                    )}
                </div>
                <div className="mt-8 xl:mt-0 xl:sticky xl:top-28">
                    <CoachPanel roadmap={roadmap} />
                </div>
            </div>
            <AnimatePresence>
                {mentorStep && (
                    <MentorOverlay
                        key={mentorStep._id}
                        roadmap={roadmap}
                        step={mentorStep}
                        cachedText={explanations[mentorStep._id]}
                        onCached={cacheExplanation}
                        onClose={() => setMentorStep(null)}
                    />
                )}
            </AnimatePresence>
        </MotionConfig>
    );
}

export default RoadmapView;
