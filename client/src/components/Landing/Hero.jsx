import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Spline from '@splinetool/react-spline';

export default function Hero() {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden bg-[#08090B]">
      {/* Subtle background glow bubbles */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-[#F5B83D]/[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-[#FFD166]/[0.04] blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10 w-full">
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-left space-y-8"
        >
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#F5B83D]/10 to-[#FFD166]/10 border border-[#F5B83D]/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#F5B83D] animate-ping" />
            <span className="text-xs font-semibold text-[#FFD166] uppercase tracking-wider">Next-Gen ATS Optimization</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#F5F5F5] leading-tight">
            Analyze Your Resume <br />
            <span className="bg-gradient-to-r from-[#F5B83D] via-[#FFD166] to-[#F5B83D] bg-clip-text text-transparent">
              with AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-[#A7ADB7] max-w-xl leading-relaxed">
            Upload your resume and receive ATS score, AI-powered feedback, recruiter insights, keyword matching, and personalized improvement suggestions in seconds.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#e5a82d] hover:to-[#f0c256] text-[#08090B] font-bold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(245,184,61,0.35)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              Analyze Resume <FaArrowRight size={14} />
            </button>
            <a 
              href="#how-it-works"
              className="flex items-center gap-2 px-7 py-4 bg-[#121519] border border-[#F5B83D]/40 hover:bg-[#171A1F] hover:border-[#F5B83D] text-[#F5F5F5] font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <FaPlay size={12} className="text-[#F5B83D]" /> Watch Demo
            </a>
          </div>
        </motion.div>

        {/* Right Side: Interactive 3D Canvas / Spline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[450px] md:h-[600px] w-full flex items-center justify-center rounded-2xl overflow-hidden"
        >
          {/* Dynamic Spline Scene */}
          <div className="absolute inset-0 w-full h-full">
            <Spline
              onLoad={() => setSplineLoaded(true)}
              scene="https://prod.spline.design/KKJMk6SzPqq5c907/scene.splinecode"
            />
          </div>

          {/* Loader Fallback */}
          {!splineLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col justify-center items-center bg-[#08090B] border border-[#292D33] rounded-2xl">
              <FaSpinner className="animate-spin text-[#F5B83D] mb-3" size={32} />
              <p className="text-[#A7ADB7] text-sm font-medium">Loading Interactive 3D Interface...</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
