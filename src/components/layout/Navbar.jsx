import { Link } from "react-router-dom";

function Navbar(){
    return(
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">SkillPath</Link>
        <div className="flex gap-6">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
        </div>
    </nav>
    );
}
export default Navbar