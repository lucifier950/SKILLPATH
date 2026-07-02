import { Link } from "react-router-dom";
function HeroSection(){
    return(
        <section className="text-center py-20 px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 neu-gradient-text">
                Learn Smarter with AI-powered Roadmaps
            </h1>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-[var(--neu-text-soft)]">
                Get a personalized learning roadmap built by AI, chat with your mentor
        24/7, and track every step of your progress.
            </p>
            <div className="flex gap-5 justify-center flex-wrap">
                <Link to="/contact">
                <button className="neu-btn-accent font-semibold px-7 py-3">
                    start learning free
                </button>
                </Link>
                <Link to="/about">
                <button className="neu-raised font-semibold px-7 py-3 rounded-xl text-[var(--neu-text)] hover:text-[var(--neu-accent)] transition-colors
                ">
                    Learn More
                </button>
                </Link>
            </div>
        </section>
    );
}
export default HeroSection