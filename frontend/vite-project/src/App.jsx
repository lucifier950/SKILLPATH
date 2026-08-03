import { BrowserRouter, Routes,Route } from 'react-router-dom'
import LandingPage from "./components/Pages/LandingPage";
import Navbar from './components/layout/Navbar';
import CommandPalette from './components/layout/CommandPalette';
import AboutPage from './components/Pages/AboutPage';
import Footer from './components/layout/Footer';
import ContactPage from './components/Pages/ContactPage';
import NotFoundPage from './components/Pages/NotFoundPage';
import LoginPage from './components/Pages/LoginPage';
import SignUpPage from './components/Pages/SignUpPage';
import RoadmapPage from './components/Pages/RoadmapPage';
import ProtectedRoute from './components/ProtectedRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const app = (
    <ToastProvider>
    <AuthProvider>
    <BrowserRouter>
    <Navbar/>
    <CommandPalette/>
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/about" element={<AboutPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/signup" element={<SignUpPage/>}/>
      <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage/></ProtectedRoute>}/>
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>
    <Footer/>
    </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  );

  // Google sign-in activates only when VITE_GOOGLE_CLIENT_ID is configured
  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : app;
}

export default App;
