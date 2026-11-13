import { Map, Zap, TrendingUp } from "lucide-react";
import CTABanner from "../landing/CTABanner";
import FeatureCard from "../landing/FeatureCard";
import HeroSection from "../landing/HeroSection";
import HowItWorksSection from "../landing/HowItWorksSection";


function LandingPage(){
        return(
            <div>
                <HeroSection/>
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-10 max-w-6xl mx-auto">
                <FeatureCard icon={<Map size={28} />} title="AI Roadmaps" text="Personalized learning paths built just for you."/>
                <FeatureCard icon={<Zap size={28} />} title="Instant Generation" text="Powered by GPT-OSS on Groq — a complete plan in seconds." />
                <FeatureCard icon={<TrendingUp size={28} />} title="Track Progress" text="See every step you complete on your journey."/>
                </section>
                <HowItWorksSection/>
                <CTABanner/>

            </div>
        )
}
export default LandingPage