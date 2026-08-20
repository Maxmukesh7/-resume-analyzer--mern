import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaRobot } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'About', href: '/#about' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#08090B]/85 backdrop-blur-md border-b border-[#292D33] py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-tr from-[#F5B83D] to-[#FFD166] rounded-xl text-[#08090B] shadow-[0_0_15px_rgba(245,184,61,0.35)]">
              <FaRobot size={22} className="group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="text-xl font-extrabold text-[#F5F5F5] tracking-wide">
              AI Resume <span className="bg-gradient-to-r from-[#F5B83D] to-[#FFD166] bg-clip-text text-transparent">Analyzer</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#A7ADB7] hover:text-[#F5F5F5] transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Call to Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-sm font-semibold text-[#A7ADB7] hover:text-[#F5F5F5] transition-colors duration-200 cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 text-sm font-bold text-[#08090B] bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#e5a82d] hover:to-[#f0c256] rounded-xl shadow-[0_4px_20px_rgba(245,184,61,0.3)] hover:shadow-[0_4px_25px_rgba(245,184,61,0.45)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 text-[#A7ADB7] hover:text-[#F5F5F5] md:hidden transition-colors rounded-lg bg-[#121519] border border-[#292D33] cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay and Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#08090B]/95 backdrop-blur-lg flex flex-col justify-center items-center md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-bold text-[#A7ADB7] hover:text-[#F5F5F5] transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="flex flex-col gap-4 mt-8 w-64"
              >
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="w-full py-3 text-[#A7ADB7] hover:text-[#F5F5F5] font-semibold border border-[#292D33] rounded-xl bg-[#121519] cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/register');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#e5a82d] hover:to-[#f0c256] rounded-xl text-[#08090B] font-bold shadow-lg shadow-[#F5B83D]/25 cursor-pointer"
                >
                  Get Started
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
