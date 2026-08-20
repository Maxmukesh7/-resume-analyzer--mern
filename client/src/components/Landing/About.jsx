import { motion } from 'framer-motion';
import { FaShieldAlt, FaRocket, FaLightbulb, FaBriefcase } from 'react-icons/fa';

export default function About() {
  const benefits = [
    {
      title: 'Smart ATS Compatibility',
      description: 'Built to match the criteria of modern ATS parsers used by Fortune 500 companies.',
      icon: FaBriefcase,
    },
    {
      title: 'Instant Actionable Advice',
      description: 'Receive granular suggestions on wording, keywords, and structural changes instantly.',
      icon: FaLightbulb,
    },
    {
      title: 'Privacy & Data Protection',
      description: 'Your uploaded documents are processed securely and we never share your data.',
      icon: FaShieldAlt,
    },
    {
      title: 'Optimize Career Trajectory',
      description: 'Increase your callback rates by tailoring your resume alignment to specific target roles.',
      icon: FaRocket,
    },
  ];

  return (
    <section id="about" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute left-[-10%] bottom-[-10%] w-96 h-96 rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: '-100px' }}
          className="space-y-12 max-w-4xl mx-auto text-center"
        >
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              About The Platform
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white">
              Engineered to Bridge the Gap Between Talent and Recruiters
            </h3>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              The traditional job application model is broken. Modern AI filters reject up to 75% of qualified applications before they reach human eyes. Our platform helps candidates optimize and audit their resumes against advanced applicant systems.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 gap-6 pt-4 text-left">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="flex gap-4 items-start p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-all duration-300 backdrop-blur-md">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 mt-1">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
