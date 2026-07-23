import { useEffect, useRef, useState } from "react";

const DEMOS = [
    { goal: "Learn React in 8 weeks", steps: ["JSX & Components", "Hooks & State", "Router & Data Fetching"] },
    { goal: "Master SQL for interviews", steps: ["SELECT & Filtering", "Joins & Aggregation", "Window Functions"] },
    { goal: "Python for Data Science", steps: ["Python Foundations", "NumPy & Pandas", "Your First ML Model"] },
];

// Auto-playing product preview for the hero: types a goal, "thinks", then reveals
// roadmap steps one by one — a canned loop, no API calls.
function LiveDemo() {
    const [demoIdx, setDemoIdx] = useState(0);
    const [typed, setTyped] = useState("");
    const [phase, setPhase] = useState("typing"); // typing → thinking → steps → hold → (next demo)
    const [visibleSteps, setVisibleSteps] = useState(0);
    const reduced = useRef(
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    const demo = DEMOS[demoIdx];

    useEffect(() => {
        if (reduced.current) {
            setTyped(DEMOS[0].goal);
            setVisibleSteps(DEMOS[0].steps.length);
            setPhase("hold");
            return;
        }
        let timer;
        if (phase === "typing") {
            timer = typed.length < demo.goal.length
                ? setTimeout(() => setTyped(demo.goal.slice(0, typed.length + 1)), 55)
                : setTimeout(() => setPhase("thinking"), 450);
        } else if (phase === "thinking") {
            timer = setTimeout(() => setPhase("steps"), 1100);
        } else if (phase === "steps") {
            timer = visibleSteps < demo.steps.length
                ? setTimeout(() => setVisibleSteps(visibleSteps + 1), 550)
                : setTimeout(() => setPhase("hold"), 2600);
        } else if (phase === "hold") {
            timer = setTimeout(() => {
                setTyped("");
                setVisibleSteps(0);
                setDemoIdx((demoIdx + 1) % DEMOS.length);
                setPhase("typing");
            }, 500);
        }
        return () => clearTimeout(timer);
    }, [phase, typed, visibleSteps, demoIdx, demo.goal, demo.steps.length]);

    return (
        <div className="neu-card p-6 text-left" aria-hidden="true">
            <p className="text-xs font-semibold text-[var(--neu-text-soft)] mb-3 uppercase tracking-wider">
                Live preview
            </p>
            <div className="neu-input w-full p-3 text-sm mb-4 min-h-11 font-medium">
                {typed}
                <span className="sp-caret" />
            </div>
            <div className="min-h-48">
                {phase === "thinking" && (
                    <p className="text-sm text-[var(--neu-text-soft)] font-medium">
                        Generating your roadmap
                        <span className="sp-dots"><span>.</span><span>.</span><span>.</span></span>
                    </p>
                )}
                <div className="flex flex-col gap-3">
                    {demo.steps.slice(0, visibleSteps).map((step, i) => (
                        <div key={step} className="neu-raised rounded-xl px-4 py-3 sp-stream-in flex items-center gap-3">
                            <span className="neu-icon w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-[var(--neu-accent)] shrink-0">
                                {i + 1}
                            </span>
                            <span className="font-semibold text-sm">{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default LiveDemo;
