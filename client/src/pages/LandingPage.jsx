import Navbar from '../components/Landing/Navbar';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import HowItWorks from '../components/Landing/HowItWorks';
import About from '../components/Landing/About';
import CTA from '../components/Landing/CTA';
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

      {/* About Section */}
      <About />

      {/* Call to Action Section */}
      <CTA />

      {/* Footer Details */}
      <Footer />
    </div>
  );
}
