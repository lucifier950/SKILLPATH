import { Link } from "react-router-dom";

function NotFoundPage() {
    return(
    <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
        <p className="text-xl mb-6">Oops! The page you're looking for doesn't exist.</p>
        <Link to="/" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg">GO BACK HOME</Link>
    </div>
    );
}
export default NotFoundPage;