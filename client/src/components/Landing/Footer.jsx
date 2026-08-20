import { FaGithub, FaLinkedinIn, FaTwitter, FaRobot } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#08090B] border-t border-[#292D33] pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Logo & Info */}
          <div className="md:col-span-2 space-y-6">
            <a href="#home" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-tr from-[#F5B83D] to-[#FFD166] rounded-xl text-[#08090B] shadow-md">
                <FaRobot size={20} />
              </div>
              <span className="text-lg font-extrabold text-[#F5F5F5] tracking-wide">
                AI Resume <span className="bg-gradient-to-r from-[#F5B83D] to-[#FFD166] bg-clip-text text-transparent">Analyzer</span>
              </span>
            </a>
            <p className="text-[#A7ADB7] text-sm max-w-sm leading-relaxed">
              Industry-grade resume auditor helping job candidates bypass automated filtering algorithms and showcase their true qualifications.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#121519] border border-[#292D33] text-[#A7ADB7] hover:text-[#F5F5F5] hover:border-[#F5B83D]/40 transition-all">
                <FaGithub size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#121519] border border-[#292D33] text-[#A7ADB7] hover:text-[#F5F5F5] hover:border-[#F5B83D]/40 transition-all">
                <FaLinkedinIn size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#121519] border border-[#292D33] text-[#A7ADB7] hover:text-[#F5F5F5] hover:border-[#F5B83D]/40 transition-all">
                <FaTwitter size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-[#F5F5F5] font-bold text-sm uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <a href="#home" className="text-[#A7ADB7] hover:text-[#F5F5F5] text-sm transition-colors">Home</a>
              </li>
              <li>
                <a href="#features" className="text-[#A7ADB7] hover:text-[#F5F5F5] text-sm transition-colors">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="text-[#A7ADB7] hover:text-[#F5F5F5] text-sm transition-colors">How It Works</a>
              </li>
              <li>
                <a href="/about" className="text-[#A7ADB7] hover:text-[#F5F5F5] text-sm transition-colors">About</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h4 className="text-[#F5F5F5] font-bold text-sm uppercase tracking-wider mb-6">Support & Legal</h4>
            <ul className="space-y-4">
              <li>
                <a href="#privacy" className="text-[#A7ADB7] hover:text-[#F5F5F5] text-sm transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms" className="text-[#A7ADB7] hover:text-[#F5F5F5] text-sm transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom border & details */}
        <div className="border-t border-[#292D33] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#6F7682]">
          <p>&copy; {currentYear} AI Resume Analyzer. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-[#F5F5F5] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#F5F5F5] transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
