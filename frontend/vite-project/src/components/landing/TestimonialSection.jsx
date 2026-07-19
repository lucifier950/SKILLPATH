function TestimonialSection(){
    return(
        <section className="py-16 px-4">
            <h2 className="text-3xl font-bold text-center mb-10 neu-gradient-text">What Our Students Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="neu-card p-8">
                     <p className="text-[var(--neu-text-soft)] italic">"SkillPath helped me land my first internship!"</p>
                     <p className="font-semibold mt-4 text-[var(--neu-text)]">— Priya, CSE Student</p>
                </div>
                <div className="neu-card p-8">
                    <p className="text-[var(--neu-text-soft)] italic">"SkillPath helped me to gain knowledge regarding the full stack!"</p>
                    <p className="font-semibold mt-4 text-[var(--neu-text)]">— Deepanshi Bansal, CSE Student</p>
                </div>
            </div>
        </section>
    );
}
export default TestimonialSection
