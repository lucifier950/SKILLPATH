import { Link } from "react-router-dom";
function CTABanner(){
    return (
      <section className="bg-blue-600 text-white text-center py-16 px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
        <p className="text-lg mb-6">Be among the thousands of learners today</p>
        <Link to = "/contact">
        <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg">
            JOIN US NOW
        </button>
        </Link>
      </section>
    );
} 
export default CTABanner