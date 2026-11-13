import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Map } from "lucide-react";
import { useAuth } from "../../context/useAuth.js";

function initials(name) {
    return (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
}

function UserMenu() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const handleLogout = async () => {
        setOpen(false);
        await logout();
        navigate("/");
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-[4px_4px_8px_var(--neu-dark),-4px_-4px_8px_var(--neu-light)] hover:scale-105 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(145deg, #557ccb, #4361a3)" }}
            >
                {initials(user?.name)}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 mt-3 w-56 neu-card p-2 z-50 origin-top-right"
                    >
                        <div className="px-3 py-2.5">
                            <p className="font-bold text-sm truncate">{user?.name}</p>
                            <p className="text-xs text-[var(--neu-text-soft)] truncate">{user?.email}</p>
                        </div>
                        <div className="h-px mx-2 my-1 bg-[var(--neu-dark)] opacity-30" />
                        <button
                            role="menuitem"
                            onClick={() => { setOpen(false); navigate("/roadmap"); }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--neu-text-soft)] hover:text-[var(--neu-accent)] transition-colors flex items-center gap-2.5"
                        >
                            <Map size={15} /> My Roadmaps
                        </button>
                        <button
                            role="menuitem"
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--sp-error-text)] hover:opacity-75 transition-opacity flex items-center gap-2.5"
                        >
                            <LogOut size={15} /> Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default UserMenu;
