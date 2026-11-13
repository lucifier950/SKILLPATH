function HowItWorksSection(){
    const steps = [
        { num: "1", title: "Describe your goal", text: "Tell SkillPath what you want to learn, your current level, and your hours per week." },
        { num: "2", title: "AI builds your roadmap", text: "GPT-OSS 120B generates a step-by-step plan with durations and resources for each step." },
        { num: "3", title: "Learn step by step", text: "Steps unlock in order as you complete them, so you always know exactly what's next." },
    ];
    return(
        <section className="py-16 px-4">
            <h2 className="text-3xl font-bold text-center mb-10 neu-gradient-text">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {steps.map((step) => (
                    <div key={step.num} className="neu-card p-8">
                        <div className="neu-icon w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-[var(--neu-accent)] mb-4">
                            {step.num}
                        </div>
                        <p className="font-semibold text-[var(--neu-text)]">{step.title}</p>
                        <p className="text-[var(--neu-text-soft)] mt-2">{step.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
export default HowItWorksSection
