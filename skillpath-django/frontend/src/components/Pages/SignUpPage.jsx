import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { API_URL } from "../../api.js";
import { useAuth } from "../../context/useAuth.js";
import { useToast } from "../../context/useToast.js";
import GoogleAuthButton from "../GoogleAuthButton.jsx";
import AuthSky from "../auth/AuthSky.jsx";
import PasswordInput from "../auth/PasswordInput.jsx";

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
        <AuthSky title="Create your account" subtitle="Your first AI roadmap is about a minute away.">
            <form onSubmit={handleSubmit}>
                <input name="name" type="text" placeholder="Your name"
                    value={form.name} onChange={handleChange}
                    className="sp-glass-input mb-4" />
                <input name="email" type="email" placeholder="Your email"
                    value={form.email} onChange={handleChange}
                    className="sp-glass-input mb-4" />
                <PasswordInput name="password" placeholder="Your password"
                    value={form.password} onChange={handleChange} />
                <PasswordInput name="confirm" placeholder="Confirm password"
                    value={form.confirm} onChange={handleChange} />
                <button type="submit" className="sp-glass-btn">
                    Create account
                </button>
                <GoogleAuthButton />
                <p className="text-center text-[var(--neu-text-soft)] mt-5 text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="text-[var(--neu-accent)] font-semibold">Sign in</Link>
                </p>
            </form>
        </AuthSky>
    );
}

export default SignUpPage;
