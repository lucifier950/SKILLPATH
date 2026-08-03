// Spark burst for step completion. Renders straight into document.body so it
// survives the card remount that happens when a step's state changes.
const SPARK_COLORS = ["#4cc98a", "#34a86c", "#7396e4", "#f0b429"];

export function sparkBurst(x, y, count = 12) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < count; i++) {
        const spark = document.createElement("span");
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const dist = 28 + Math.random() * 26;
        spark.className = "sp-spark";
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.background = SPARK_COLORS[i % SPARK_COLORS.length];
        spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
        document.body.appendChild(spark);
        spark.addEventListener("animationend", () => spark.remove());
    }
}
