import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/useAuth.js";
import ThemeToggle from "../ThemeToggle.jsx";
import UserMenu from "./UserMenu.jsx";

const NAV_ITEMS = [
    { to: "/", label: "Home" },
    { to: "/roadmap", label: "Roadmap" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
];

function Navbar(){
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    const close = () => setOpen(false);

    return (
    <nav className={`sp-nav m-4 rounded-2xl sticky top-4 z-50 ${scrolled ? "sp-nav-scrolled px-5 py-2.5" : "px-6 py-3.5"}`}>
        <div className="flex items-center justify-between gap-4">
            <Link to="/" onClick={close} className="text-xl font-extrabold tracking-tight text-[var(--neu-accent)]">
                SkillPath
            </Link>

            <div className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.to === "/"} className="relative px-4 py-2 rounded-xl text-sm font-semibold">
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.span
                                        layoutId="sp-nav-pill"
                                        className="absolute inset-0 neu-pressed rounded-xl"
                                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                    />
                                )}
                                <span className={`relative transition-colors ${isActive ? "text-[var(--neu-accent)]" : "text-[var(--neu-text-soft)] hover:text-[var(--neu-text)]"}`}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>

            <div className="flex items-center gap-2.5">
                <ThemeToggle />
                {user ? (
                    <UserMenu />
                ) : (
                    <div className="hidden md:flex items-center gap-2.5">
                        <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--neu-text-soft)] hover:text-[var(--neu-text)] transition-colors">
                            Login
                        </Link>
                        <Link to="/signup">
                            <button className="neu-btn-accent font-semibold text-sm px-5 py-2.5">Sign Up</button>
                        </Link>
                    </div>
                )}
                <button
                    type="button"
                    className="md:hidden neu-raised p-2 rounded-xl text-[var(--neu-text)]"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    aria-label={open ? "Close menu" : "Open menu"}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        {open ? (
                            <>
                                <path d="M6 6l12 12" />
                                <path d="M18 6L6 18" />
                            </>
                        ) : (
                            <>
                                <path d="M4 7h16" />
                                <path d="M4 12h16" />
                                <path d="M4 17h16" />
                            </>
                        )}
                    </svg>
                </button>
            </div>
        </div>

        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="md:hidden overflow-hidden"
                >
                    <div className="flex flex-col gap-1 pt-4 pb-1">
                        {NAV_ITEMS.map((item, i) => (
                            <motion.div
                                key={item.to}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 + i * 0.05 }}
                            >
                                <NavLink
                                    to={item.to}
                                    end={item.to === "/"}
                                    onClick={close}
                                    className={({ isActive }) =>
                                        `block px-4 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "neu-pressed text-[var(--neu-accent)]" : "text-[var(--neu-text-soft)]"}`
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            </motion.div>
                        ))}
                        {!user && (
                            <motion.div
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 }}
                                className="flex gap-3 pt-2 px-1"
                            >
                                <Link to="/login" onClick={close} className="flex-1">
                                    <button className="w-full neu-raised rounded-xl py-2.5 text-sm font-semibold text-[var(--neu-text)]">Login</button>
                                </Link>
                                <Link to="/signup" onClick={close} className="flex-1">
                                    <button className="w-full neu-btn-accent py-2.5 text-sm font-semibold">Sign Up</button>
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </nav>
    );
}
export default Navbar
