import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../api.js";

const API = `${API_URL}/api/roadmaps`;

function RoadmapPage() {
    const [form, setForm] = useState({ goal: "", level: "beginner", weeklyHours: 5 });
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [needsLogin, setNeedsLogin] = useState(false);

    const loadRoadmaps = async () => {
        try {
            const res = await fetch(API, { credentials: "include" });
            if (res.status === 401) {
                setNeedsLogin(true);
                return;
            }
            const data = await res.json();
            setRoadmaps(data);
        } catch (err) {
            alert("Cannot reach the server — is the backend running?");
        }
    };

    useEffect(() => {
        loadRoadmaps();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.goal) {
            alert("Please enter what you want to learn");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ ...form, weeklyHours: Number(form.weeklyHours) }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message);
                return;
            }
            setRoadmaps([data, ...roadmaps]);
            setForm({ ...form, goal: "" });
        } catch (err) {
            alert("Cannot reach the server — is the backend running?");
        } finally {
            setLoading(false);
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
                alert(data.message);
                return;
            }
            setRoadmaps((prev) => prev.map((rm) => (rm._id === data._id ? data : rm)));
        } catch (err) {
            alert("Cannot reach the server — is the backend running?");
        }
    };

    if (needsLogin) {
        return (
            <div className="max-w-xl mx-auto py-16 px-4 text-center">
                <div className="neu-card p-8">
                    <p className="text-lg mb-4">Please log in to build your learning roadmap.</p>
                    <Link to="/login" className="neu-btn-accent inline-block px-6 py-3 font-semibold">Go to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center neu-gradient-text">
                Your AI Learning Roadmap
            </h1>

            <form onSubmit={handleSubmit} className="neu-card p-8 mb-10">
                <label className="block font-semibold mb-2">
                    What do you want to learn? 🎯
                </label>
                <input
                    name="goal"
                    type="text"
                    placeholder="e.g. React, Python, Data Science..."
                    value={form.goal}
                    onChange={handleChange}
                    className="neu-input w-full p-3 mb-4"
                />
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block font-semibold mb-2">
                            Your current level
                        </label>
                        <select name="level" value={form.level} onChange={handleChange} className="neu-input w-full p-3">
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block font-semibold mb-2">
                            Hours per week
                        </label>
                        <input
                            name="weeklyHours"
                            type="number"
                            min="1"
                            max="60"
                            value={form.weeklyHours}
                            onChange={handleChange}
                            className="neu-input w-full p-3"
                        />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="neu-btn-accent w-full font-semibold py-3">
                    {loading ? "Generating your roadmap with AI..." : "Generate Roadmap"}
                </button>
            </form>

            {roadmaps.map((rm) => {
                const total = rm.steps.length;
                const done = rm.steps.filter((s) => s.completed).length;
                const currentIdx = rm.steps.findIndex((s) => !s.completed);
                const pct = total ? Math.round((done / total) * 100) : 0;

                return (
                    <div key={rm._id} className="neu-card p-8 mb-8">
                        <div className="flex justify-between items-baseline flex-wrap gap-2">
                            <h2 className="text-2xl font-bold text-[var(--neu-accent)] capitalize">{rm.goal}</h2>
                            <span className="text-sm font-semibold text-[var(--neu-text-soft)]">
                                {done}/{total} steps · {pct}%
                            </span>
                        </div>
                        <p className="text-[var(--neu-text-soft)] mb-4 capitalize">
                            {rm.level} · {rm.weeklyHours}h/week · {rm.estimatedDuration}
                        </p>

                        <div className="sp-progress-track mb-8">
                            <div className="sp-progress-fill" style={{ width: `${pct}%` }} />
                        </div>

                        <div className="sp-timeline">
                            {rm.steps.map((step, i) => {
                                const state = step.completed
                                    ? "completed"
                                    : i === currentIdx
                                    ? "current"
                                    : "locked";
                                return (
                                    <div key={step._id} className={`sp-step ${state}`}>
                                        <div className="sp-rail">
                                            <button
                                                className="sp-node"
                                                disabled={state === "locked"}
                                                onClick={() => toggleStep(rm._id, step._id)}
                                                title={
                                                    state === "locked"
                                                        ? "Finish the previous step to unlock"
                                                        : step.completed
                                                        ? "Click to un-complete"
                                                        : "Click to mark complete"
                                                }
                                            >
                                                {step.completed ? "✓" : state === "locked" ? "🔒" : step.stepNumber}
                                            </button>
                                            {i < total - 1 && <div className="sp-line" />}
                                        </div>

                                        <div className="sp-content neu-raised">
                                            <p className="font-semibold">
                                                {step.title}
                                                <span className="text-[var(--neu-text-soft)] font-normal"> — {step.duration}</span>
                                            </p>
                                            <div className="sp-body">
                                                <p className="text-[var(--neu-text-soft)] mt-2">{step.description}</p>
                                                {step.resources?.length > 0 && (
                                                    <p className="text-sm mt-2">
                                                        📚 <span className="font-semibold">Resources:</span> {step.resources.join(", ")}
                                                    </p>
                                                )}
                                                {state === "current" && (
                                                    <button
                                                        onClick={() => toggleStep(rm._id, step._id)}
                                                        className="neu-btn-accent px-5 py-2 mt-4 font-semibold text-sm"
                                                    >
                                                        Mark complete ✓
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {total > 0 && done === total && (
                            <div className="sp-complete-banner">
                                🎉 Roadmap complete! You've mastered <span className="capitalize font-bold">{rm.goal}</span>.
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default RoadmapPage;
