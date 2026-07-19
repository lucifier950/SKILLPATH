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
                <input
                    name="goal"
                    type="text"
                    placeholder="What do you want to learn? (e.g. React, Python...)"
                    value={form.goal}
                    onChange={handleChange}
                    className="neu-input w-full p-3 mb-4"
                />
                <div className="flex gap-4 mb-4">
                    <select name="level" value={form.level} onChange={handleChange} className="neu-input flex-1 p-3">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                    <input
                        name="weeklyHours"
                        type="number"
                        min="1"
                        max="60"
                        value={form.weeklyHours}
                        onChange={handleChange}
                        className="neu-input flex-1 p-3"
                        placeholder="Hours per week"
                    />
                </div>
                <button type="submit" disabled={loading} className="neu-btn-accent w-full font-semibold py-3">
                    {loading ? "Generating your roadmap with AI..." : "Generate Roadmap"}
                </button>
            </form>

            {roadmaps.map((rm) => (
                <div key={rm._id} className="neu-card p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-1 text-[var(--neu-accent)]">{rm.goal}</h2>
                    <p className="text-[var(--neu-text-soft)] mb-6">
                        {rm.level} · {rm.weeklyHours}h/week · {rm.estimatedDuration}
                    </p>
                    {rm.steps.map((step) => (
                        <div key={step._id} className="neu-raised rounded-xl p-4 mb-3">
                            <p className="font-semibold">
                                {step.stepNumber}. {step.title}
                                <span className="text-[var(--neu-text-soft)] font-normal"> — {step.duration}</span>
                            </p>
                            <p className="text-[var(--neu-text-soft)]">{step.description}</p>
                            {step.resources?.length > 0 && (
                                <p className="text-sm mt-1">Resources: {step.resources.join(", ")}</p>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default RoadmapPage;
