import { Link } from "react-router-dom";
function HeroSection(){
    return(
        <section className="bg-blue-600 text-white text-center py-20 px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Learn Smarter with AI-powered Roadmaps
            </h1>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
                Get a personalized learning roadmap built by AI, chat with your mentor
        24/7, and track every step of your progress.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/contact">
                <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg">
                    start learning free
                </button>
                </Link>
                <Link to="/about">
                <button className="border border-white font-semibold px-6 py-3 rounded-lg">
                    Learn More
                </button>
                </Link>
            </div>
        </section>
    );
}
export default HeroSection