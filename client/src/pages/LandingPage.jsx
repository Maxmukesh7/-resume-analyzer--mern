import Navbar from '../components/Landing/Navbar';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import HowItWorks from '../components/Landing/HowItWorks';
import Footer from '../components/Landing/Footer';

export default function LandingPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans antialiased selection:bg-blue-600/35 selection:text-white">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Feature Section */}
      <Features />

      {/* How it Works Section */}
      <HowItWorks />

      {/* Footer Details */}
      <Footer />
    </div>
  );
}
