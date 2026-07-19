import { Link } from "react-router-dom";

function Navbar(){
    return(
    <nav className="neu-raised m-4 px-6 py-4 rounded-2xl flex justify-between items-center sticky top-4 z-50">
        <Link to="/" className="neu-raised px-4 py-2 rounded-xl text-xl font-bold text-[var(--neu-accent)]">SkillPath</Link>
        <div className="flex gap-3">
            <Link to="/" className="neu-raised px-4 py-2 rounded-xl font-medium hover:text-[var(--neu-accent)] transition-colors">Home</Link>
            <Link to="/roadmap" className="neu-raised px-4 py-2 rounded-xl font-medium hover:text-[var(--neu-accent)] transition-colors">Roadmap</Link>
            <Link to="/about" className="neu-raised px-4 py-2 rounded-xl font-medium hover:text-[var(--neu-accent)] transition-colors">About</Link>
            <Link to="/contact" className="neu-raised px-4 py-2 rounded-xl font-medium hover:text-[var(--neu-accent)] transition-colors">Contact</Link>
            <Link to="/login" className="neu-raised px-4 py-2 rounded-xl font-medium hover:text-[var(--neu-accent)] transition-colors">Login</Link>
            <Link to="/signup" className="neu-raised px-4 py-2 rounded-xl font-medium hover:text-[var(--neu-accent)] transition-colors">Sign Up</Link>
        </div>
    </nav>
    );
}
export default Navbar