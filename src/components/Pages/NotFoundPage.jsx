import { Link } from "react-router-dom";

function NotFoundPage() {
    return(
    <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="neu-card p-10">
            <h1 className="text-7xl font-bold mb-4 neu-gradient-text">404</h1>
            <p className="text-xl mb-8 text-[var(--neu-text-soft)]">Oops! The page you're looking for doesn't exist.</p>
            <Link to="/">
                <button className="neu-btn-accent font-semibold px-7 py-3">GO BACK HOME</button>
            </Link>
        </div>
    </div>
    );
}
export default NotFoundPage;