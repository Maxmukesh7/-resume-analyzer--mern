import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Spline from '@splinetool/react-spline';

export default function Hero() {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden bg-slate-950">
      {/* Subtle background glow bubbles */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10 w-full">
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-left space-y-8"
        >
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Next-Gen ATS Optimization</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Analyze Your Resume <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              with AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
            Upload your resume and receive ATS score, AI-powered feedback, recruiter insights, keyword matching, and personalized improvement suggestions in seconds.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(79,70,229,0.4)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              Analyze Resume <FaArrowRight size={14} />
            </button>
            <a 
              href="#how-it-works"
              className="flex items-center gap-2 px-7 py-4 bg-slate-900/60 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <FaPlay size={12} className="text-blue-400" /> Watch Demo
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
            <div className="absolute inset-0 z-10 flex flex-col justify-center items-center bg-slate-950 border border-slate-900 rounded-2xl">
              <FaSpinner className="animate-spin text-blue-500 mb-3" size={32} />
              <p className="text-slate-400 text-sm font-medium">Loading Interactive 3D Interface...</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
