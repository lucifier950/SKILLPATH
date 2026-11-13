import { Link } from "react-router-dom";
import GithubIcon from "../icons/GithubIcon.jsx";

function Footer(){
    return (
        <footer className="neu-raised m-4 px-8 py-6 rounded-2xl">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <div>
                    <p className="font-extrabold tracking-tight text-[var(--neu-accent)]">SkillPath</p>
                    <p className="text-sm text-[var(--neu-text-soft)]">Your learning path, generated in seconds.</p>
                </div>
                <nav className="flex gap-5 text-sm font-medium text-[var(--neu-text-soft)]" aria-label="Footer">
                    <Link to="/roadmap" className="hover:text-[var(--neu-accent)] transition-colors">Roadmap</Link>
                    <Link to="/about" className="hover:text-[var(--neu-accent)] transition-colors">About</Link>
                    <Link to="/contact" className="hover:text-[var(--neu-accent)] transition-colors">Contact</Link>
                    <a href="https://github.com/lucifier950/SKILLPATH" target="_blank" rel="noreferrer" className="hover:text-[var(--neu-accent)] transition-colors inline-flex items-center gap-1">
                        <GithubIcon size={15} /> GitHub
                    </a>
                </nav>
                <p className="text-sm text-[var(--neu-text-soft)]">&copy; 2026 SkillPath · SDG 4: Quality Education</p>
            </div>
        </footer>
    );
}
export default Footer
