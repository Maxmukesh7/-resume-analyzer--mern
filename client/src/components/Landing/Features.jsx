import { motion } from 'framer-motion';
import { FaGraduationCap, FaRobot, FaSearch, FaFileImport, FaHistory, FaUserTie } from 'react-icons/fa';

export default function Features() {
  const features = [
    {
      title: 'ATS Score Analysis',
      description: 'Find out exactly how a standard applicant tracking system parses your resume, complete with format scores and parseability reviews.',
      icon: FaSearch,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'AI Resume Review',
      description: 'Receive rich, sentence-by-sentence recommendations powered by advanced AI models to refine your vocabulary and phrasing.',
      icon: FaRobot,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      title: 'Skill Gap Detection',
      description: 'Identify matching keywords and key skills missing from your resume that are highly demanded in target job scopes.',
      icon: FaGraduationCap,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Job Description Matching',
      description: 'Upload target job descriptions to obtain custom alignment scores, checking matches for roles, responsibilities, and qualifications.',
      icon: FaFileImport,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Resume History',
      description: 'Maintain versions of your resume and track score improvements over time directly on your secure profile dashboard.',
      icon: FaHistory,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Recruiter Insights',
      description: 'Discover how recruiters read your profile with simulated scanning heatmaps and feedback on readability and structure.',
      icon: FaUserTie,
      color: 'from-violet-500 to-purple-500',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <section id="features" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background glow circle */}
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Features
          </h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-white">
            Unlock Smarter Job Searching
          </h3>
          <p className="text-slate-400 text-sm md:text-base">
            Equip yourself with industry-grade tools built on state-of-the-art AI to optimize your application process.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-8 rounded-2xl bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/80 transition-all duration-300 backdrop-blur-md overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div className={`absolute -right-20 -bottom-20 w-40 h-40 rounded-full bg-gradient-to-tr ${feat.color} opacity-0 group-hover:opacity-10 blur-[40px] transition-opacity duration-500`} />

                {/* Icon wrapper */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-tr ${feat.color} text-white shadow-md mb-6`}>
                  <Icon size={24} />
                </div>

                {/* Card Title */}
                <h4 className="text-lg font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {feat.title}
                </h4>

                {/* Card Description */}
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feat.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
