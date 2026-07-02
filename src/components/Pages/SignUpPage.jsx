import { useState } from "react";
import { Link } from "react-router-dom";
import PhoneRegister from "../auth/PhoneRegister";

function SignUpPage(){
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password || !form.confirm) {
            alert("Please fill all the fields");
            return;
        }
        if (form.password !== form.confirm) {
            alert("Passwords do not match");
            return;
        }
        setSubmitted(true);
    };

    return (
        <div className="max-w-xl mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center neu-gradient-text">
                Sign Up
            </h1>
            {submitted ? (
                <div className="neu-card p-8 text-center">
                    <p className="text-[var(--neu-accent)] text-lg font-semibold">
                        Account created! Welcome to SkillPath.
                    </p>
                </div>
            ) : (
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
                    <p className="text-center text-[var(--neu-text-soft)] mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-[var(--neu-accent)] font-semibold">Login</Link>
                    </p>
                </form>
            )}
            <p className="text-center text-[var(--neu-text-soft)] my-6">or register with your phone</p>
            <PhoneRegister />
        </div>
    );
}

export default SignUpPage;
