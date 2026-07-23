import { createContext, useEffect, useState } from "react";
import { API_URL } from "../api.js";

// eslint-disable-next-line react-refresh/only-export-components -- context object must live beside its provider
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function loadUser() {
            try {
                const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
                if (!cancelled && res.ok) setUser(await res.json());
            } catch {
                // server unreachable — treat as logged out
            } finally {
                if (!cancelled) setChecking(false);
            }
        }
        loadUser();
        return () => { cancelled = true; };
    }, []);

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
        } catch {
            // clear local state even if the server is unreachable
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, checking, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
