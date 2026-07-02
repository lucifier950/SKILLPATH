import CTABanner from "../landing/CTABanner";
import FeatureCard from "../landing/FeatureCard";
import HeroSection from "../landing/HeroSection";
import TestimonialSection from "../landing/TestimonialSection";


function LandingPage(){
        return(
            <div>
                <HeroSection/>
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-10 max-w-6xl mx-auto">
                <FeatureCard icon="🗺️" title="AI Roadmaps" text="Personalized learning paths built just for you."/>
                <FeatureCard icon="🤖" title="24/7 AI Mentor" text= "Chat with your AI tutor anytime you get stuck." />
                <FeatureCard icon="📈" title="Track Progress" text="See every step you complete on your journey."/>
                </section>
                <TestimonialSection/>
                <CTABanner/>

            </div>
        )
}
export default LandingPage