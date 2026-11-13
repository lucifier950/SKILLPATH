import { useEffect, useRef } from "react";
import Logo from "../Logo.jsx";

// Shared shell for login/signup: CSS-drawn sky (night in dark theme, dawn in
// light) with a frosted-glass card that tilts gently toward the cursor.
function AuthSky({ title, subtitle, children }) {
    const cardRef = useRef(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (window.matchMedia("(pointer: coarse)").matches) return;
        const onMove = (e) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            card.style.setProperty("--ry", `${nx * 6}deg`);
            card.style.setProperty("--rx", `${-ny * 6}deg`);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
    }, []);

    return (
        <div className="sp-sky-wrap relative overflow-hidden">
            <div className="sp-sky" aria-hidden="true">
                <span className="sp-celestial" />
            </div>
            <div className="relative flex items-center justify-center px-4 py-16 min-h-[85vh]">
                <div ref={cardRef} className="sp-glass w-full max-w-md p-8">
                    <p className="sp-glass-eyebrow"><Logo size={16} /> SkillPath</p>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">{title}</h1>
                    <p className="text-[var(--neu-text-soft)] mb-7">{subtitle}</p>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AuthSky;
