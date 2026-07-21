import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

export default function CTA() {
  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden">
      {/* Absolute glow balls */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-gradient-to-tr from-blue-600/10 to-purple-600/10 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative p-12 md:p-16 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md overflow-hidden text-center space-y-8"
        >
          {/* Subtle decoration elements */}
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />

          {/* Tag */}
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full">
            Maximize Success Rate
          </span>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight max-w-2xl mx-auto">
            Ready to Land Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Dream Job</span>?
          </h2>

          {/* Description */}
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Upload your resume today and see why top career coaches recommend tailoring your CV with our advanced AI analysis.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1">
              Get Started Now <FaArrowRight size={12} />
            </button>
            <button className="px-8 py-4 bg-slate-950/60 border border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700 font-bold rounded-xl transition-all duration-300 hover:-translate-y-1">
              Learn More
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
