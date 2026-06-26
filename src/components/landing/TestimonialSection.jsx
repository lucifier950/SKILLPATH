function TestimonialSection(){
    return(
        <section className="bg-gray-50 py-16 px-4">
            <h2 className="text-3xl font-bold text-center mb-10">What Our Student Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                     <p className="text-gray-600 italic">"SkillPath helped me land my first internship!"</p>
                     <p className="font-semibold mt-4">— Priya, CSE Student</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <p className="text-gray-600 italic">"SkillPath helped me to gain knowledge regarding the full stack!"</p>
                    <p className="font-semibold mt-4">— Deepanshi Bansal, CSE Student</p>
                </div>
            </div>
        </section>
    );
}
export default TestimonialSection