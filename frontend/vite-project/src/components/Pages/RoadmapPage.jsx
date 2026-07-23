import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { API_URL } from "../../api.js";
import { useAuth } from "../../context/useAuth.js";
import { useToast } from "../../context/useToast.js";
import RoadmapView from "../roadmap/RoadmapView.jsx";
import ActivityPanel from "../roadmap/ActivityPanel.jsx";
import { computeActivity } from "../../utils/activity.js";

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

    const exampleGoals = ["React", "Python for Data Science", "System Design"];

    const selected = roadmaps.find((rm) => rm._id === selectedId) || roadmaps[0] || null;
    const totalSteps = roadmaps.reduce((n, rm) => n + rm.steps.length, 0);
    const doneSteps = roadmaps.reduce((n, rm) => n + rm.steps.filter((s) => s.completed).length, 0);
    const overallPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
    const { counts, streak } = useMemo(() => computeActivity(roadmaps), [roadmaps]);

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
                        <input
                            id="goal-input"
                            ref={goalInputRef}
                            name="goal"
                            type="text"
                            placeholder="e.g. React, Python, Data Science..."
                            value={form.goal}
                            onChange={handleChange}
                            className="neu-input w-full p-3 mb-4"
                        />
                        <div className="mb-4">
                            <label className="block font-semibold mb-2" htmlFor="level-select">
                                Your current level
                            </label>
                            <select id="level-select" name="level" value={form.level} onChange={handleChange} className="neu-input w-full p-3">
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="neu-btn-accent w-full font-semibold py-3">
                            {loading ? "Generating your roadmap with AI..." : "Generate Roadmap"}
                        </button>
                    </form>

                    {streaming && (
                        <div className="neu-card p-8 mb-8">
                            <div className="flex justify-between items-baseline flex-wrap gap-2">
                                <h2 className="text-2xl font-bold text-[var(--neu-accent)] capitalize">{streaming.goal}</h2>
                                {streaming.estimatedDuration && (
                                    <span className="text-sm font-semibold text-[var(--neu-text-soft)]">{streaming.estimatedDuration}</span>
                                )}
                            </div>
                            <p className="text-[var(--neu-text-soft)] mb-6 font-medium">
                                {streaming.stage}
                                <span className="sp-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
                            </p>
                            <div className="sp-timeline">
                                {streaming.steps.map((step, i) => (
                                    <div key={i} className="sp-step sp-stream-in">
                                        <div className="sp-rail">
                                            <div className="sp-node sp-node-static">{step.stepNumber}</div>
                                            <div className="sp-line" />
                                        </div>
                                        <div className="sp-content neu-raised">
                                            <p className="font-semibold">
                                                {step.title}
                                                <span className="text-[var(--neu-text-soft)] font-normal"> — {step.duration}</span>
                                            </p>
                                            <p className="text-[var(--neu-text-soft)] mt-2">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
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
                            <p className="text-[var(--neu-text-soft)] mb-6">
                                Describe a goal above and watch AI build your learning path — or try one of these:
                            </p>
                            <div className="flex gap-3 justify-center flex-wrap">
                                {exampleGoals.map((goal) => (
                                    <button
                                        key={goal}
                                        onClick={() => setForm({ ...form, goal })}
                                        className="neu-raised rounded-full px-5 py-2 font-semibold text-sm text-[var(--neu-accent)] hover:text-[var(--neu-text)] transition-colors"
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selected && !streaming && (
                        <RoadmapView roadmap={selected} onToggleStep={toggleStep} />
                    )}
                </main>
            </div>
        </div>
    );
}

export default RoadmapPage;
