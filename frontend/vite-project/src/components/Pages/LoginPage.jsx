import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../api.js";
import { useAuth } from "../../context/useAuth.js";
import { useToast } from "../../context/useToast.js";
import GoogleAuthButton from "../GoogleAuthButton.jsx";
import AuthSky from "../auth/AuthSky.jsx";
import PasswordInput from "../auth/PasswordInput.jsx";

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
        <AuthSky title="Welcome back" subtitle="Sign in to continue to SkillPath.">
            <form onSubmit={handleSubmit}>
                <input name="email" type="email" placeholder="Your email" value={form.email} onChange={handleChange} className="sp-glass-input mb-4"/>
                <PasswordInput name="password" placeholder="Your password" value={form.password} onChange={handleChange}/>
                <button type="submit" className="sp-glass-btn">Sign in</button>
                <GoogleAuthButton />
                <p className="text-center text-[var(--neu-text-soft)] mt-5 text-sm">
                    New to SkillPath?{" "}
                    <Link to="/signup" className="text-[var(--neu-accent)] font-semibold">Create account</Link>
                </p>
            </form>
        </AuthSky>
    );

}
export default LoginPage
