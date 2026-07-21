import { FaGithub, FaLinkedinIn, FaTwitter, FaRobot } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-slate-950 border-t border-slate-900 pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Logo & Info */}
          <div className="md:col-span-2 space-y-6">
            <a href="#home" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl text-white shadow-md">
                <FaRobot size={20} />
              </div>
              <span className="text-lg font-extrabold text-white tracking-wide">
                AI Resume <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Analyzer</span>
              </span>
            </a>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Industry-grade resume auditor helping job candidates bypass automated filtering algorithms and showcase their true qualifications.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                <FaGithub size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                <FaLinkedinIn size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                <FaTwitter size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <a href="#home" className="text-slate-400 hover:text-white text-sm transition-colors">Home</a>
              </li>
              <li>
                <a href="#features" className="text-slate-400 hover:text-white text-sm transition-colors">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#about" className="text-slate-400 hover:text-white text-sm transition-colors">About</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6">Support & Legal</h4>
            <ul className="space-y-4">
              <li>
                <a href="#privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#contact" className="text-slate-400 hover:text-white text-sm transition-colors">Contact Support</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom border & details */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} AI Resume Analyzer. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
