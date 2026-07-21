import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaRobot, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../components/Common/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden font-sans text-slate-100 text-center">
      {/* Background neon glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full space-y-8 z-10 flex flex-col items-center"
      >
        {/* Dynamic lost robot illustration */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full blur-xl opacity-40 animate-pulse" />
          <div className="w-32 h-32 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-blue-400 relative z-10">
            <FaRobot size={58} className="animate-bounce" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 p-2 bg-rose-600 rounded-xl text-white shadow-lg z-20">
            <FaExclamationTriangle size={14} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-7xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-extrabold text-white tracking-wide">
            Page Not Found
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-semibold max-w-sm mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <Button
          onClick={() => navigate('/')}
          icon={<FaHome size={14} />}
          className="px-8 mt-2"
        >
          Go Back Home
        </Button>
      </motion.div>
    </div>
  );
}
