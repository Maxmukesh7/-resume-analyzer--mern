import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FaThLarge, 
  FaCloudUploadAlt, 
  FaHistory, 
  FaChartBar, 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaRobot,
  FaTimes,
  FaBriefcase,
  FaMagic,
  FaTrophy
} from 'react-icons/fa';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FaThLarge size={18} /> },
    { name: 'Upload Resume', path: '/dashboard/upload', icon: <FaCloudUploadAlt size={18} /> },
    { name: 'Resume History', path: '/dashboard/history', icon: <FaHistory size={18} /> },
    { name: 'ATS Reports', path: '/dashboard/report', icon: <FaChartBar size={18} /> },
    { name: 'AI Insights', path: '/dashboard/ai-analysis', icon: <FaRobot size={18} /> },
    { name: 'AI Improvement', path: '/dashboard/improve', icon: <FaMagic size={18} /> },
    { name: 'Job Match', path: '/dashboard/job-match', icon: <FaBriefcase size={18} /> },
    { name: 'Candidate Ranking', path: '/dashboard/rankings', icon: <FaTrophy size={18} /> },
    { name: 'Profile', path: '/dashboard/profile', icon: <FaUser size={18} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <FaCog size={18} /> },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800/80 z-50 flex flex-col justify-between py-6 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full lg:overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div>
          {/* Logo Section */}
          <div className="px-6 flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <FaRobot size={18} className="group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-base font-extrabold text-white tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                ATS <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Analyzer</span>
              </span>
            </Link>

            {/* Mobile close button */}
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1">
            {menuItems.map((item) => {
              // Active route matching:
              // For Dashboard it matches exactly "/dashboard". For others it matches startsWith.
              const isActive = item.path === '/dashboard' 
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group
                    ${isActive 
                      ? 'text-white bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]' 
                      : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/30'
                    }`}
                >
                  {/* Left accent bar for active item */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSideAccent"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <span className={`transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="px-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 border border-transparent hover:bg-rose-950/10 hover:border-rose-900/25 transition-all cursor-pointer text-left"
          >
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
