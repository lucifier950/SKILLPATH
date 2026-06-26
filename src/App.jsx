import { BrowserRouter, Routes,Route } from 'react-router-dom'
import LandingPage from "./components/Pages/LandingPage";
import Navbar from './components/layout/Navbar';
import AboutPage from './components/Pages/AboutPage';
import Footer from './components/layout/Footer';
import ContactPage from './components/Pages/ContactPage';
import NotFoundPage from './components/Pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
    <Navbar/>
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/about" element={<AboutPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/>
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>
    <Footer/>
    </BrowserRouter>
  );
}

export default App;