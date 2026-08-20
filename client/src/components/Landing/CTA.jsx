import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

export default function CTA() {
  return (
    <section className="py-20 bg-[#08090B] relative overflow-hidden">
      {/* Absolute glow balls */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-gradient-to-tr from-[#F5B83D]/[0.06] to-[#FFD166]/[0.04] blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative p-12 md:p-16 rounded-3xl bg-[#121519] border border-[#292D33] backdrop-blur-md overflow-hidden text-center space-y-8"
        >
          {/* Subtle decoration elements */}
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#F5B83D]/[0.02] rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#FFD166]/[0.02] rounded-full blur-[60px] pointer-events-none" />

          {/* Tag */}
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FFD166] bg-[#F5B83D]/10 px-3.5 py-1.5 rounded-full border border-[#F5B83D]/20">
            Maximize Success Rate
          </span>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#F5F5F5] leading-tight max-w-2xl mx-auto">
            Ready to Land Your <span className="bg-gradient-to-r from-[#F5B83D] to-[#FFD166] bg-clip-text text-transparent">Dream Job</span>?
          </h2>

          {/* Description */}
          <p className="text-[#A7ADB7] text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Upload your resume today and see why top career coaches recommend tailoring your CV with our advanced AI analysis.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#e5a82d] hover:to-[#f0c256] text-[#08090B] font-bold rounded-xl shadow-lg shadow-[#F5B83D]/25 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              Get Started Now <FaArrowRight size={12} />
            </button>
            <button className="px-8 py-4 bg-[#0D0F12] border border-[#292D33] text-[#A7ADB7] hover:text-[#F5F5F5] hover:border-[#F5B83D]/40 font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              Learn More
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
