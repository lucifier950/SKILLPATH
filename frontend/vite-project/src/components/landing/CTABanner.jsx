import { Link } from "react-router-dom";
function CTABanner(){
    return (
      <section className="px-4 pb-20">
        <div className="neu-pressed max-w-4xl mx-auto text-center py-16 px-6 rounded-3xl">
          <h2 className="text-3xl font-bold mb-4 neu-gradient-text">Ready to Start Your Journey?</h2>
          <p className="text-lg mb-8 text-[var(--neu-text-soft)]">Be among the thousands of learners today</p>
          <Link to="/contact">
          <button className="neu-btn-accent font-semibold px-8 py-3">
              JOIN US NOW
          </button>
          </Link>
        </div>
      </section>
    );
}
export default CTABanner
