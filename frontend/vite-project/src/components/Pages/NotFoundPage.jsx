import { Link } from "react-router-dom";
import { Map } from "lucide-react";

function NotFoundPage() {
    return(
    <div className="relative overflow-hidden">
        <div className="sp-aurora" aria-hidden="true"><span /><span /><span /></div>
        <div className="relative max-w-xl mx-auto py-24 px-4 text-center">
            <h1 className="text-8xl md:text-9xl font-extrabold tracking-tight neu-gradient-text mb-2">404</h1>
            <p className="text-xl font-bold mb-2">This page isn't on any roadmap.</p>
            <p className="text-[var(--neu-text-soft)] mb-10">
                Even the AI couldn't generate a path to it. Let's get you back on track.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/">
                    <button className="neu-btn-accent font-semibold px-7 py-3">Back to Home</button>
                </Link>
                <Link to="/roadmap">
                    <button className="neu-raised font-semibold px-7 py-3 rounded-xl inline-flex items-center gap-2 text-[var(--neu-text)] hover:text-[var(--neu-accent)] transition-colors">
                        <Map size={18} /> My Roadmaps
                    </button>
                </Link>
            </div>
        </div>
    </div>
    );
}
export default NotFoundPage;
