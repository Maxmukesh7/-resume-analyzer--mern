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
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Stylized dashboard preview card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: '-100px' }}
            className="p-8 rounded-2xl bg-gradient-to-tr from-slate-900/60 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden group"
          >
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/10 blur-[40px]" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-[40px]" />

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              Platform Impact Audit
            </h3>

            <div className="space-y-6">
              {/* Stat 1 */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-400">Average Interview Callbacks</span>
                  <span className="text-sm font-bold text-green-400">+145%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 w-[85%]" />
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-400">ATS Parsing Success Rate</span>
                  <span className="text-sm font-bold text-blue-400">99.2%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[99%]" />
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-400">Time Saved Per Resume Tailoring</span>
                  <span className="text-sm font-bold text-purple-400">4.5 Hours</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-[75%]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Platform Information */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                About The Platform
              </h2>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white">
                Engineered to Bridge the Gap Between Talent and Recruiters
              </h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                The traditional job application model is broken. Modern AI filters reject up to 75% of qualified applications before they reach human eyes. Our platform helps candidates optimize and audit their resumes against advanced applicant systems.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 mt-1">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        {benefit.title}
                      </h4>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
