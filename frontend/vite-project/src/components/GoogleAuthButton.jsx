import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api.js";
import { useAuth } from "../context/useAuth.js";
import { useToast } from "../context/useToast.js";

function GoogleAuthButton() {
    const { setUser } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

    const handleSuccess = async (credentialResponse) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast(data.message, "error");
                return;
            }
            setUser(data);
            toast(`Welcome, ${data.name?.split(" ")[0]}!`, "success");
            navigate("/roadmap", { replace: true });
        } catch {
            toast("Cannot reach the server — please try again", "error");
        }
    };

    return (
        <div className="mt-5 flex flex-col items-center gap-3">
            <p className="text-[var(--neu-text-soft)] text-sm">or continue with</p>
            <GoogleLogin onSuccess={handleSuccess} onError={() => toast("Google sign-in failed", "error")} />
        </div>
    );
}

export default GoogleAuthButton;
