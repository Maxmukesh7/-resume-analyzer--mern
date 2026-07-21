import { motion } from 'framer-motion';
import { FaFileUpload, FaBrain, FaChartBar, FaFileDownload } from 'react-icons/fa';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Upload Resume',
      description: 'Upload your existing resume in PDF format safely. Your data remains secure and encrypted.',
      icon: FaFileUpload,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      number: '02',
      title: 'AI Parses Resume',
      description: 'Our specialized parser reads structure, content, experiences, and format components.',
      icon: FaBrain,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      number: '03',
      title: 'ATS + AI Analysis',
      description: 'The engine scores readability, formatting, matching keywords, and extracts recommendations.',
      icon: FaChartBar,
      color: 'from-purple-500 to-pink-500',
    },
    {
      number: '04',
      title: 'Download Report',
      description: 'Review your personalized scoring, update suggestions, and export a clean PDF feedback draft.',
      icon: FaFileDownload,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section id="how-it-works" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background glow bubble */}
      <div className="absolute right-[5%] top-[20%] w-80 h-80 rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Workflow
          </h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-white">
            Simple 4-Step Analysis
          </h3>
          <p className="text-slate-400 text-sm md:text-base">
            Optimize your job application process in a matter of seconds.
          </p>
        </div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-4 gap-8 relative"
        >
          {/* Connector line for large screens */}
          <div className="hidden lg:block absolute top-[25%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-900/50 via-indigo-900/50 to-purple-900/50 -z-10" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center text-center group"
              >
                {/* Number tag */}
                <span className="text-sm font-extrabold text-slate-600 group-hover:text-blue-400 transition-colors mb-3">
                  STEP {step.number}
                </span>

                {/* Circle Icon Badge */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6 relative`}>
                  <Icon size={20} />
                  {/* Subtle pulsing background ring */}
                  <span className="absolute -inset-2 rounded-full border border-blue-500/10 scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>

                {/* Title */}
                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {step.title}
                </h4>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed px-4">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
