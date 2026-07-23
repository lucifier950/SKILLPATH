import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../api.js";
import { useAuth } from "../../context/useAuth.js";
import { useToast } from "../../context/useToast.js";
import GoogleAuthButton from "../GoogleAuthButton.jsx";

function LoginPage(){
    const [form,setForm] = useState({email: "",password:""});
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/roadmap";
    const handleChange =(e) =>{
        setForm({...form,[e.target.name]: e.target.value})
    };
    const handleSubmit =async (e) =>{
       e.preventDefault();
    if (!form.email || !form.password) {
        toast("Please fill all the fields", "error");
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
            toast(data.message, "error");
            return;
        }
        setUser(data);
        toast(`Welcome back, ${data.name?.split(" ")[0]}!`, "success");
        navigate(from, { replace: true });
    } catch {
        toast("Cannot reach the server — please try again", "error");
    }
    };
    if (user) {
        return <Navigate to="/roadmap" replace />;
    }
    return(
        <div className="relative overflow-hidden">
        <div className="sp-aurora" aria-hidden="true"><span /><span /><span /></div>
        <div className="relative max-w-xl mx-auto py-16 px-4">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-center neu-gradient-text">
                Welcome back
            </h1>
            <p className="text-center text-[var(--neu-text-soft)] mb-8">
                Pick up right where you left off.
            </p>
            <form onSubmit={handleSubmit} className="neu-card p-8">
                <input name="email" type="email" placeholder="Your email" value={form.email} onChange={handleChange} className="neu-input w-full p-3 mb-4"/>
                <input name="password" type="password" placeholder="Your Password" value={form.password} onChange={handleChange} className="neu-input w-full p-3 mb-4"/>
                <button type ="submit" className="neu-btn-accent w-full font-semibold py-3">Login</button>
                <GoogleAuthButton />
                <p className="text-center text-[var(--neu-text-soft)] mt-4">
                    New to SkillPath?{" "}
                    <Link to="/signup" className="text-[var(--neu-accent)] font-semibold">Create an account</Link>
                </p>
            </form>
        </div>
        </div>
    );

}
export default LoginPage