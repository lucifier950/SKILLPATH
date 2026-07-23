import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function ProtectedRoute({ children }) {
    const { user, checking } = useAuth();
    const location = useLocation();

    if (checking) {
        return (
            <div className="max-w-3xl mx-auto py-16 px-4">
                <div className="neu-card p-8 animate-pulse">
                    <div className="neu-pressed h-6 w-1/2 rounded-lg mb-4" />
                    <div className="neu-pressed h-4 w-1/3 rounded-lg" />
                </div>
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    return children;
}

export default ProtectedRoute;
