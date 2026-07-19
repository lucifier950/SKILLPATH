import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../api.js";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function LoginPage(){
    const [form,setForm] = useState({email: "",password:""});
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();
    const handleChange =(e) =>{
        setForm({...form,[e.target.name]: e.target.value})
    };
    const handleSubmit =async (e) =>{
       e.preventDefault();
    if (!form.email || !form.password) {
        alert("Please fill all the fields");
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
            alert(data.message);
            return;
        }
        navigate("/roadmap");
    } catch (err) {
        alert("Cannot reach the server — is the backend running?");
    }
    };
    const handleGoogleSuccess = (credentialResponse) => {
        const user = jwtDecode(credentialResponse.credential);
        console.log("Google user:", user);
        setSubmitted(true);
    };
    return(
        <div className="max-w-xl mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center neu-gradient-text">
                Login
            </h1>
            {submitted ? (
                <div className="neu-card p-8 text-center">
                    <p className="text-[var(--neu-accent)] text-lg font-semibold">
                        Welcome back! You are logged in.
                    </p>
                </div>
            ):(
                <form onSubmit={handleSubmit} className="neu-card p-8">
                    <input name="email" type="email" placeholder="Your email" value={form.email} onChange={handleChange} className="neu-input w-full p-3 mb-4"/>
                    <input name="password" type="password" placeholder="Your Password" value={form.password} onChange={handleChange} className="neu-input w-full p-3 mb-4"/>
                    <button type ="submit" className="neu-btn-accent w-full font-semibold py-3">Login</button>
                    <p className="text-center text-[var(--neu-text-soft)] my-4">or</p>
                    <div className="flex justify-center">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google login failed")} />
                    </div>
                </form>
            )}
        </div>
    );
    
}
export default LoginPage