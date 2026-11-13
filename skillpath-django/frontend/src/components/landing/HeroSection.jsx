import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import LiveDemo from "./LiveDemo.jsx";
import SkillConstellation from "./SkillConstellation.jsx";

const HEADLINE = "Your learning path, generated in seconds".split(" ");

function HeroSection(){
    const reduced = useReducedMotion();
    return(
        <section className="relative overflow-hidden">
            <SkillConstellation />
            <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center pointer-events-none">
                <div className="text-center md:text-left pointer-events-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5 neu-gradient-text">
                        {HEADLINE.map((word, i) => (
                            <motion.span
                                key={i}
                                className="inline-block"
                                initial={reduced ? false : { opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {word}
                                {i < HEADLINE.length - 1 ? " " : ""}
                            </motion.span>
                        ))}
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
                        Powered by GPT-OSS 120B on Groq &middot; Open source on <a href="https://github.com/lucifier950/SKILLPATH" className="underline hover:text-[var(--neu-accent)]">GitHub</a>
                    </p>
                </div>
                <div className="pointer-events-auto">
                    <LiveDemo />
                </div>
            </div>
        </section>
    );
}
export default HeroSection
