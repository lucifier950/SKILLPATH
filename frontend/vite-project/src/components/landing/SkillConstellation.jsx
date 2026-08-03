import { useEffect, useRef } from "react";

const SKILLS = [
    "React", "Python", "System Design", "Docker", "Machine Learning",
    "GraphQL", "Rust", "Next.js", "TypeScript", "SQL", "AWS", "Node.js",
    "Git", "CSS",
];

const LINK_DIST = 140;   // px — pairs closer than this get a connecting line
const MOUSE_DIST = 180;  // px — nodes inside this radius drift toward the cursor
const MAX_SPEED = 0.6;

// Ambient skill-node constellation behind the hero. pointer-events stays off
// so the canvas can never swallow clicks on the CTAs — the mouse is tracked
// from the parent section instead.
function SkillConstellation() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        const ctx = canvas.getContext("2d");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let raf = 0;
        let visible = true;
        let W = 0, H = 0;
        const mouse = { x: -1e4, y: -1e4 };

        // colors come from the theme tokens; re-read when the toggle flips
        let accent = "#4b6cb7";
        let soft = "#5d6b85";
        const readTheme = () => {
            const cs = getComputedStyle(document.documentElement);
            accent = cs.getPropertyValue("--neu-accent").trim() || accent;
            soft = cs.getPropertyValue("--neu-text-soft").trim() || soft;
        };
        readTheme();
        const themeObs = new MutationObserver(() => {
            readTheme();
            if (reduced) drawFrame(); // static mode still needs a repaint on theme change
        });
        themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        const nodes = SKILLS.map((label) => ({
            label,
            x: Math.random(), y: Math.random(), // normalized until first resize
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: 2 + Math.random() * 1.5,
        }));
        let normalized = true;

        const resize = () => {
            const rect = parent.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = rect.width;
            H = rect.height;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (normalized) {
                nodes.forEach((n) => { n.x *= W; n.y *= H; });
                normalized = false;
            }
            if (reduced) drawFrame();
        };

        const step = () => {
            for (const n of nodes) {
                const dx = mouse.x - n.x;
                const dy = mouse.y - n.y;
                const d = Math.hypot(dx, dy);
                if (d < MOUSE_DIST && d > 1) {
                    const pull = 0.03 * (1 - d / MOUSE_DIST);
                    n.vx += (dx / d) * pull;
                    n.vy += (dy / d) * pull;
                }
                n.vx *= 0.985; // damping — drift toward the cursor, never slingshot
                n.vy *= 0.985;
                const speed = Math.hypot(n.vx, n.vy);
                if (speed > MAX_SPEED) {
                    n.vx = (n.vx / speed) * MAX_SPEED;
                    n.vy = (n.vy / speed) * MAX_SPEED;
                }
                if (speed < 0.05) { // never fully stall
                    n.vx += (Math.random() - 0.5) * 0.04;
                    n.vy += (Math.random() - 0.5) * 0.04;
                }
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > W) n.vx *= -1;
                if (n.y < 0 || n.y > H) n.vy *= -1;
                n.x = Math.min(Math.max(n.x, 0), W);
                n.y = Math.min(Math.max(n.y, 0), H);
            }
        };

        const drawFrame = () => {
            ctx.clearRect(0, 0, W, H);
            ctx.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < LINK_DIST) {
                        ctx.globalAlpha = (1 - d / LINK_DIST) * 0.35;
                        ctx.strokeStyle = accent;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.font = "10px 'Inter Variable', system-ui, sans-serif";
            ctx.textAlign = "center";
            for (const n of nodes) {
                ctx.globalAlpha = 0.14; // halo
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.85; // core
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = soft;
                ctx.fillText(n.label, n.x, n.y - n.r * 3 - 4);
            }
            ctx.globalAlpha = 1;
        };

        const loop = () => {
            step();
            drawFrame();
            raf = requestAnimationFrame(loop);
        };

        const onMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };
        const onLeave = () => { mouse.x = -1e4; mouse.y = -1e4; };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(parent);

        if (!reduced) {
            parent.addEventListener("pointermove", onMove);
            parent.addEventListener("pointerleave", onLeave);
            // pause the loop while the hero is scrolled off-screen
            const io = new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                cancelAnimationFrame(raf);
                if (visible) raf = requestAnimationFrame(loop);
            });
            io.observe(parent);
            raf = requestAnimationFrame(loop);

            return () => {
                cancelAnimationFrame(raf);
                io.disconnect();
                ro.disconnect();
                themeObs.disconnect();
                parent.removeEventListener("pointermove", onMove);
                parent.removeEventListener("pointerleave", onLeave);
            };
        }

        // reduced motion: one static constellation, no loop, no mouse pull
        drawFrame();
        return () => {
            ro.disconnect();
            themeObs.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
        />
    );
}

export default SkillConstellation;
