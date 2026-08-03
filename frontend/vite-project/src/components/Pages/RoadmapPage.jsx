import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { API_URL } from "../../api.js";
import { useAuth } from "../../context/useAuth.js";
import { useToast } from "../../context/useToast.js";
import RoadmapView from "../roadmap/RoadmapView.jsx";
import ActivityPanel from "../roadmap/ActivityPanel.jsx";
import XPPanel from "../gamification/XPPanel.jsx";
import LevelUpModal from "../gamification/LevelUpModal.jsx";
import { computeActivity } from "../../utils/activity.js";
import { calculateXP, getLevel } from "../../utils/gamification.js";

const API = `${API_URL}/api/roadmaps`;

function RoadmapPage() {
    const [form, setForm] = useState({ goal: "", level: "beginner", weeklyHours: 5 });
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [streaming, setStreaming] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const { setUser } = useAuth();
    const { toast } = useToast();
    const goalInputRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const reducedMotion = useReducedMotion();

    // The command palette navigates here with {selectId} — adjust the selection
    // during render (react's "storing information from previous renders" pattern),
    // keyed by location.key so each navigation is consumed exactly once.
    const [consumedNav, setConsumedNav] = useState(null);
    if (location.state?.selectId && consumedNav !== location.key) {
        setConsumedNav(location.key);
        setSelectedId(location.state.selectId);
    }

    // {newRoadmap} is a pure DOM side effect (focus), then the hint is cleared
    // so back/refresh doesn't replay either hint
    useEffect(() => {
        if (!location.state) return;
        if (location.state.newRoadmap) {
            goalInputRef.current?.focus();
            goalInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        navigate(location.pathname, { replace: true, state: null });
    }, [location.state, location.pathname, navigate]);

    const [expanding, setExpanding] = useState(false);

    const suggestions = [
        { emoji: "🚀", label: "Fullstack React" },
        { emoji: "🤖", label: "Python for Machine Learning" },
        { emoji: "⚡", label: "System Design Fundamentals" },
        { emoji: "🎨", label: "UI/UX Design" },
        { emoji: "📊", label: "Data Engineering" },
    ];
    const levels = ["beginner", "intermediate", "advanced"];

    const selected = roadmaps.find((rm) => rm._id === selectedId) || roadmaps[0] || null;
    const totalSteps = roadmaps.reduce((n, rm) => n + rm.steps.length, 0);
    const doneSteps = roadmaps.reduce((n, rm) => n + rm.steps.filter((s) => s.completed).length, 0);
    const overallPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
    const { counts, streak } = useMemo(() => computeActivity(roadmaps), [roadmaps]);
    const xp = useMemo(() => calculateXP(roadmaps, streak), [roadmaps, streak]);
    const level = getLevel(xp);
    const [levelUp, setLevelUp] = useState(null);
    const prevLevel = useRef(null);

    // Level is derived, so level-up detection is just watching it climb.
    // prevLevel starts null so the initial data load never triggers the modal.
    useEffect(() => {
        if (fetching) return;
        if (prevLevel.current !== null && level > prevLevel.current) {
            setLevelUp(level);
        }
        prevLevel.current = level;
    }, [level, fetching]);

    useEffect(() => {
        let cancelled = false;
        async function loadRoadmaps() {
            try {
                const res = await fetch(API, { credentials: "include" });
                if (res.status === 401) {
                    // session expired mid-visit — clearing the user lets ProtectedRoute redirect to login
                    if (!cancelled) setUser(null);
                    return;
                }
                const data = await res.json();
                if (!cancelled) setRoadmaps(data);
            } catch {
                if (!cancelled) toast("Cannot reach the server — please try again", "error");
            } finally {
                if (!cancelled) setFetching(false);
            }
        }
        loadRoadmaps();
        return () => { cancelled = true; };
    }, [setUser, toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = { ...form, [name]: value };
        // If the goal is written in natural language ("learn SQL, I have 10 hours a week,
        // I'm a beginner"), sync the structured fields so the saved data matches the prompt
        if (name === "goal") {
            const hoursMatch = value.match(/(\d{1,2})\s*(?:hours?|hrs?|h\b)/i);
            if (hoursMatch) {
                next.weeklyHours = Math.min(60, Math.max(1, Number(hoursMatch[1])));
            }
            const levelMatch = value.match(/\b(beginner|intermediate|advanced)\b/i);
            if (levelMatch) {
                next.level = levelMatch[1].toLowerCase();
            }
        }
        setForm(next);
    };

    const startNewRoadmap = () => {
        goalInputRef.current?.focus();
        goalInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const expandPrompt = async () => {
        if (!form.goal.trim() || expanding) return;
        setExpanding(true);
        try {
            const res = await fetch(`${API}/enhance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ goal: form.goal }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) { setUser(null); return; }
                toast(data.message || "Could not expand the prompt", "error");
                return;
            }
            setForm((f) => ({ ...f, goal: data.goal }));
            goalInputRef.current?.focus();
        } catch {
            toast("Cannot reach the server — please try again", "error");
        } finally {
            setExpanding(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.goal) {
            toast("Please enter what you want to learn", "error");
            return;
        }
        setLoading(true);
        setStreaming({ goal: form.goal, stage: "Analyzing your goal", estimatedDuration: null, steps: [] });
        try {
            const res = await fetch(`${API}/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ...form, weeklyHours: Number(form.weeklyHours) }),
            });
            if (!res.ok) {
                if (res.status === 401) {
                    setUser(null);
                    return;
                }
                const data = await res.json().catch(() => ({}));
                toast(data.message || "Roadmap generation failed", "error");
                return;
            }
            // SSE over fetch: read the body stream and split on blank-line event boundaries
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split("\n\n");
                buffer = events.pop();
                for (const raw of events) {
                    if (!raw.startsWith("data: ")) continue;
                    const event = JSON.parse(raw.slice(6));
                    if (event.type === "meta") {
                        setStreaming((s) => ({ ...s, estimatedDuration: event.estimatedDuration, stage: "Structuring milestones" }));
                    } else if (event.type === "step") {
                        setStreaming((s) => ({ ...s, steps: [...s.steps, event.step], stage: `Writing step ${event.index + 2}` }));
                    } else if (event.type === "done") {
                        setRoadmaps((prev) => [event.roadmap, ...prev]);
                        setSelectedId(event.roadmap._id);
                        setForm((f) => ({ ...f, goal: "" }));
                        toast(`Your ${event.roadmap.goal} roadmap is ready!`, "success");
                    } else if (event.type === "error") {
                        toast(event.message, "error");
                    }
                }
            }
        } catch {
            toast("Cannot reach the server — please try again", "error");
        } finally {
            setLoading(false);
            setStreaming(null);
        }
    };

    const toggleStep = async (roadmapId, stepId) => {
        try {
            const res = await fetch(`${API}/${roadmapId}/steps/${stepId}`, {
                method: "PATCH",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.message, "error");
                return;
            }
            setRoadmaps((prev) => prev.map((rm) => (rm._id === data._id ? data : rm)));
        } catch {
            toast("Cannot reach the server — please try again", "error");
        }
    };

    const stats = [
        { label: "Roadmaps", value: roadmaps.length },
        { label: "Steps completed", value: `${doneSteps}/${totalSteps}` },
        { label: "Overall progress", value: `${overallPct}%` },
        { label: "Day streak", value: `🔥 ${streak}` },
    ];

    return (
        <div className="max-w-7xl mx-auto py-10 px-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8 text-center neu-gradient-text">
                Your AI Learning Roadmap
            </h1>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {roadmaps.length > 0 && (
                    <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
                        <div className="neu-card p-4">
                            <button
                                onClick={startNewRoadmap}
                                className="neu-btn-accent w-full font-semibold py-2.5 mb-4 text-sm"
                            >
                                + New Roadmap
                            </button>
                            <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1" aria-label="Your roadmaps">
                                {roadmaps.map((rm) => {
                                    const total = rm.steps.length;
                                    const done = rm.steps.filter((s) => s.completed).length;
                                    const pct = total ? Math.round((done / total) * 100) : 0;
                                    const isSelected = selected && rm._id === selected._id;
                                    return (
                                        <button
                                            key={rm._id}
                                            onClick={() => setSelectedId(rm._id)}
                                            aria-current={isSelected ? "true" : undefined}
                                            className="relative shrink-0 lg:shrink lg:w-full text-left rounded-xl px-4 py-3 transition-colors hover:text-[var(--neu-accent)]"
                                        >
                                            {isSelected && (
                                                <motion.span
                                                    layoutId="sp-active-pill"
                                                    className="absolute inset-0 neu-pressed rounded-xl"
                                                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                                />
                                            )}
                                            <span className="relative block font-semibold capitalize truncate max-w-40 lg:max-w-none">{rm.goal}</span>
                                            <span className="relative block text-xs text-[var(--neu-text-soft)] mt-0.5">{pct}% complete</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                        <XPPanel xp={xp} />
                        <ActivityPanel counts={counts} streak={streak} />
                    </aside>
                )}

                <main className={`flex-1 min-w-0 w-full ${roadmaps.length === 0 ? "max-w-3xl mx-auto" : ""}`}>
                    {roadmaps.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                            {stats.map((stat) => (
                                <div key={stat.label} className="neu-pressed rounded-2xl px-4 py-5 text-center">
                                    <p className="text-2xl font-bold text-[var(--neu-text)]">{stat.value}</p>
                                    <p className="text-xs font-medium text-[var(--neu-text-soft)] mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="neu-card p-8 mb-10">
                        <label className="block font-semibold mb-2" htmlFor="goal-input">
                            What do you want to learn? 🎯
                        </label>
                        <div className="sp-command flex items-center gap-2 mb-3">
                            <input
                                id="goal-input"
                                ref={goalInputRef}
                                name="goal"
                                type="text"
                                placeholder="e.g. React, Python, Data Science..."
                                value={form.goal}
                                onChange={handleChange}
                                className="flex-1 bg-transparent border-none outline-none p-3 text-[var(--neu-text)] placeholder-[var(--neu-text-soft)]"
                            />
                            <button
                                type="button"
                                onClick={expandPrompt}
                                disabled={expanding || !form.goal.trim()}
                                title="Let AI make your goal more specific"
                                className="sp-expand-btn shrink-0 mr-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--neu-accent)] disabled:opacity-40 transition-opacity"
                            >
                                {expanding ? "Expanding…" : "✨ Expand"}
                            </button>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-5">
                            {suggestions.map(({ emoji, label }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => { setForm((f) => ({ ...f, goal: label })); goalInputRef.current?.focus(); }}
                                    className="neu-raised rounded-full px-4 py-1.5 text-sm font-medium text-[var(--neu-text-soft)] hover:text-[var(--neu-accent)] transition-colors"
                                >
                                    {emoji} {label}
                                </button>
                            ))}
                        </div>
                        <div className="mb-5">
                            <p className="font-semibold mb-2">Your current level</p>
                            <div className="sp-seg neu-pressed rounded-full p-1 flex" role="radiogroup" aria-label="Your current level">
                                {levels.map((lvl) => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        role="radio"
                                        aria-checked={form.level === lvl}
                                        onClick={() => setForm((f) => ({ ...f, level: lvl }))}
                                        className={`relative flex-1 rounded-full py-2 text-sm font-semibold capitalize transition-colors ${
                                            form.level === lvl ? "text-white" : "text-[var(--neu-text-soft)] hover:text-[var(--neu-text)]"
                                        }`}
                                    >
                                        {form.level === lvl && (
                                            <motion.div
                                                layoutId="active-level-pill"
                                                className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--neu-accent)] to-[#6a8fe0]"
                                                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                            />
                                        )}
                                        <span className="relative">{lvl}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="neu-btn-accent w-full font-semibold py-3">
                            {loading ? "Generating your roadmap with AI..." : "Generate Roadmap"}
                        </button>
                    </form>

                    {streaming && (
                        <div className="neu-card p-8 mb-8">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="sp-orb sp-orb-sm thinking" aria-hidden="true">
                                    <span className="sp-radar-ring" />
                                    <span className="sp-radar-ring" style={{ animationDelay: "0.9s" }} />
                                    <div className="sp-orb-core" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-baseline gap-3 flex-wrap">
                                        <h2 className="text-2xl font-bold text-[var(--neu-accent)] capitalize">{streaming.goal}</h2>
                                        {streaming.estimatedDuration && (
                                            <span className="text-sm font-semibold text-[var(--neu-text-soft)]">{streaming.estimatedDuration}</span>
                                        )}
                                    </div>
                                    <p className="text-[var(--neu-text-soft)] font-medium" aria-live="polite">
                                        {streaming.stage}
                                        <span className="sp-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
                                    </p>
                                </div>
                            </div>
                            <div className="sp-timeline">
                                {streaming.steps.map((step, i) => (
                                    <motion.div
                                        key={i}
                                        className="sp-step"
                                        initial={reducedMotion ? false : { y: 30, opacity: 0, scale: 0.95 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    >
                                        <div className="sp-rail">
                                            <div className="sp-node sp-node-static">{step.stepNumber}</div>
                                            <div className="sp-line sp-line-live" />
                                        </div>
                                        <div className="sp-content neu-raised">
                                            <p className="font-semibold">
                                                {step.title}
                                                <span className="text-[var(--neu-text-soft)] font-normal"> — {step.duration}</span>
                                            </p>
                                            <p className="text-[var(--neu-text-soft)] mt-2">{step.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                                {/* the step Groq is writing right now */}
                                <div className="sp-step" aria-hidden="true">
                                    <div className="sp-rail">
                                        <div className="sp-node sp-node-static sp-node-ghost">{streaming.steps.length + 1}</div>
                                    </div>
                                    <div className="sp-content neu-pressed">
                                        <div className="sp-skel-bar w-2/3" />
                                        <div className="sp-skel-bar w-full mt-3" />
                                        <div className="sp-skel-bar w-1/2 mt-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {fetching && (
                        <div className="neu-card p-8 mb-8 animate-pulse">
                            <div className="neu-pressed h-6 w-1/2 rounded-lg mb-4" />
                            <div className="neu-pressed h-4 w-1/3 rounded-lg mb-6" />
                            <div className="neu-pressed h-3 w-full rounded-lg" />
                        </div>
                    )}

                    {!fetching && !streaming && roadmaps.length === 0 && (
                        <div className="neu-card p-8 text-center">
                            <p className="text-lg font-semibold mb-2">No roadmaps yet</p>
                            <p className="text-[var(--neu-text-soft)]">
                                Describe a goal above — or tap one of the suggestions — and watch AI build your learning path.
                            </p>
                        </div>
                    )}

                    {selected && !streaming && (
                        <RoadmapView roadmap={selected} onToggleStep={toggleStep} />
                    )}
                </main>
            </div>
            <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />
        </div>
    );
}

export default RoadmapPage;
