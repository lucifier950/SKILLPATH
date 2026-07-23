import { Link } from "react-router-dom";
import LiveDemo from "./LiveDemo.jsx";

function HeroSection(){
    return(
        <section className="relative overflow-hidden">
            <div className="sp-aurora" aria-hidden="true"><span /><span /><span /></div>
            <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5 neu-gradient-text">
                        Your learning path, generated in seconds
                    </h1>
                    <p className="text-lg mb-8 max-w-xl mx-auto md:mx-0 text-[var(--neu-text-soft)]">
                        Tell SkillPath what you want to learn — AI builds a step-by-step
                        roadmap sized to your level and schedule, and tracks every step you complete.
                    </p>
                    <div className="flex gap-5 justify-center md:justify-start flex-wrap">
                        <Link to="/signup">
                        <button className="neu-btn-accent font-semibold px-7 py-3">
                            Start Learning Free
                        </button>
                        </Link>
                        <Link to="/about">
                        <button className="neu-raised font-semibold px-7 py-3 rounded-xl text-[var(--neu-text)] hover:text-[var(--neu-accent)] transition-colors">
                            Learn More
                        </button>
                        </Link>
                    </div>
                    <p className="mt-6 text-sm font-medium text-[var(--neu-text-soft)]">
                        Powered by Llama 3.3 70B &middot; Open source on <a href="https://github.com/lucifier950/SKILLPATH" className="underline hover:text-[var(--neu-accent)]">GitHub</a>
                    </p>
                </div>
                <LiveDemo />
            </div>
        </section>
    );
}
export default HeroSection
