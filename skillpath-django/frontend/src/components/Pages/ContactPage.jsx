import { useState } from "react";
import { Mail, MessageSquareText, Clock } from "lucide-react";
import { API_URL } from "../../api.js";
import { useToast } from "../../context/useToast.js";

function ContactPage(){
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);
    const { toast } = useToast();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.subject || !form.message) {
            toast("Please fill all the fields", "error");
            return;
        }
        setSending(true);
        try {
            const res = await fetch(`${API_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.message, "error");
                return;
            }
            setSubmitted(true);
            toast("Message sent!", "success");
        } catch {
            toast("Cannot reach the server — please try again", "error");
        } finally {
            setSending(false);
        }
    };

    return(
        <div className="relative overflow-hidden">
            <div className="sp-aurora" aria-hidden="true"><span /><span /><span /></div>
            <div className="relative max-w-4xl mx-auto py-16 px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center neu-gradient-text">
                    Say hello
                </h1>
                <p className="text-lg text-center max-w-xl mx-auto text-[var(--neu-text-soft)] mb-12">
                    Feedback, ideas, or a bug you spotted — every message lands in our inbox.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                    <div className="md:col-span-2 flex flex-col gap-4">
                        {[
                            { icon: <MessageSquareText size={20} />, title: "Feedback first", text: "Feature ideas and rough edges — we read everything." },
                            { icon: <Mail size={20} />, title: "Direct line", text: "Your message is stored securely and reviewed by the team." },
                            { icon: <Clock size={20} />, title: "Quick turnaround", text: "We usually respond within a couple of days." },
                        ].map((item) => (
                            <div key={item.title} className="neu-card p-6 flex items-start gap-4">
                                <div className="neu-icon w-11 h-11 rounded-full flex items-center justify-center text-[var(--neu-accent)] shrink-0">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-bold">{item.title}</p>
                                    <p className="text-sm text-[var(--neu-text-soft)] mt-1">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="md:col-span-3">
                        {submitted ? (
                            <div className="neu-card p-10 text-center">
                                <p className="text-2xl font-extrabold tracking-tight neu-gradient-text mb-3">Message sent 🎉</p>
                                <p className="text-[var(--neu-text-soft)]">
                                    Thanks, {form.name.split(" ")[0]} — we've got it and we'll get back to you soon.
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
                                <input name="subject" type="text" placeholder="Subject"
                                    value={form.subject} onChange={handleChange}
                                    className="neu-input w-full p-3 mb-4" />
                                <textarea name="message" placeholder="Your Message" rows="5"
                                    value={form.message} onChange={handleChange}
                                    className="neu-input w-full p-3 mb-4" />
                                <button type="submit" disabled={sending} className="neu-btn-accent w-full font-semibold py-3">
                                    {sending ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default ContactPage
