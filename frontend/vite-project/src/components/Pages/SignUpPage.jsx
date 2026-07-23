import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { API_URL } from "../../api.js";
import { useAuth } from "../../context/useAuth.js";
import { useToast } from "../../context/useToast.js";
import GoogleAuthButton from "../GoogleAuthButton.jsx";

function SignUpPage(){
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password || !form.confirm) {
            toast("Please fill all the fields", "error");
            return;
        }
        if (form.password !== form.confirm) {
            toast("Passwords do not match", "error");
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.message, "error");
                return;
            }
            setUser(data);
            toast(`Account created — welcome to SkillPath, ${data.name?.split(" ")[0]}!`, "success");
            navigate("/roadmap", { replace: true });
        } catch {
            toast("Cannot reach the server — please try again", "error");
        }
    };

    if (user) {
        return <Navigate to="/roadmap" replace />;
    }

    return (
        <div className="relative overflow-hidden">
        <div className="sp-aurora" aria-hidden="true"><span /><span /><span /></div>
        <div className="relative max-w-xl mx-auto py-16 px-4">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-center neu-gradient-text">
                Create your account
            </h1>
            <p className="text-center text-[var(--neu-text-soft)] mb-8">
                Your first AI roadmap is about a minute away.
            </p>
            <form onSubmit={handleSubmit} className="neu-card p-8">
                    <input name="name" type="text" placeholder="Your Name"
                        value={form.name} onChange={handleChange}
                        className="neu-input w-full p-3 mb-4" />
                    <input name="email" type="email" placeholder="Your Email"
                        value={form.email} onChange={handleChange}
                        className="neu-input w-full p-3 mb-4" />
                    <input name="password" type="password" placeholder="Your Password"
                        value={form.password} onChange={handleChange}
                        className="neu-input w-full p-3 mb-4" />
                    <input name="confirm" type="password" placeholder="Confirm Password"
                        value={form.confirm} onChange={handleChange}
                        className="neu-input w-full p-3 mb-4" />
                    <button type="submit" className="neu-btn-accent w-full font-semibold py-3">
                        Create Account
                    </button>
                    <GoogleAuthButton />
                    <p className="text-center text-[var(--neu-text-soft)] mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-[var(--neu-accent)] font-semibold">Login</Link>
                    </p>
                </form>
        </div>
        </div>
    );
}

export default SignUpPage;
