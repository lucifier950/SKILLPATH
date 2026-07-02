function AboutPage(){
    return(
        <div className="max-w-4xl mx-auto py-16 px-4">
            <h1 className="text-4xl font-bold mb-8 text-center neu-gradient-text">About SkillPath</h1>
            <div className="neu-card p-8 md:p-10 space-y-4">
            <p className="text-lg text-[var(--neu-text-soft)]">
                SkillPath is an AI-powered learning platform built to help students and
        aspiring developers master in-demand skills with confidence. Instead of
        leaving learners to figure things out alone, SkillPath generates a
        personalized roadmap for each user and pairs it with a 24/7 AI mentor,
        so guidance is always one click away.
            </p>
            <p className="text-lg text-[var(--neu-text-soft)]">
                Our purpose is simple: make quality, structured education accessible to
        everyone. We believe learning should be clear, practical, and
        goal-driven — which is why every roadmap is broken into achievable steps,
        with real project ideas and progress tracking that keeps you motivated
        from your first lesson to your first job.
            </p>
            <p className="text-lg text-[var(--neu-text-soft)]">
               Key features include AI-generated learning roadmaps tailored to your
        goals, an always-available AI mentor to answer your questions, curated
        project suggestions to build a strong portfolio, and step-by-step
        progress tracking so you always know what to learn next.
            </p>
            </div>
        </div>
    );
}
export default AboutPage