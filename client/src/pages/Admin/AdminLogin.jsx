import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiShield, FiLock, FiMail, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(email, password, true);
    setLoading(false);

    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setError(res.error || 'Authentication failed. Ensure credentials have administrator privileges.');
    }
  };

  const fillQuickCredentials = () => {
    setEmail('admin@resumeanalyzer.com');
    setPassword('Admin@123456');
  };

  return (
    <div className="min-h-screen bg-[#08090B] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F5B83D]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FFD166]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#F5B83D] to-[#FFD166] rounded-2xl flex items-center justify-center text-[#08090B] mx-auto shadow-xl shadow-[#F5B83D]/30 mb-4 border border-[#F5B83D]/40 font-bold">
            <FiShield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F5F5] tracking-tight">Admin Portal Login</h1>
          <p className="text-sm text-[#A7ADB7] mt-2">
            Secure administrative control center for AI Resume Analyzer
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#A7ADB7] uppercase tracking-wider mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-3.5 text-[#6F7682] w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@resumeanalyzer.com"
                  className="w-full bg-[#0D0F12] border border-[#292D33] focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D] rounded-xl pl-12 pr-4 py-3 text-sm text-[#F5F5F5] placeholder-[#6F7682] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A7ADB7] uppercase tracking-wider mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-3.5 text-[#6F7682] w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0D0F12] border border-[#292D33] focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D] rounded-xl pl-12 pr-4 py-3 text-sm text-[#F5F5F5] placeholder-[#6F7682] outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#e5a82d] hover:to-[#f0c256] text-[#08090B] font-bold text-sm shadow-lg shadow-[#F5B83D]/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Admin Auto-fill Helper */}
          <div className="mt-6 pt-6 border-t border-[#292D33]">
            <button
              type="button"
              onClick={fillQuickCredentials}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] border border-[#292D33] text-[#F5F5F5] text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiCheckCircle className="w-4 h-4 text-[#F5B83D]" />
              <span>Use Default Admin Credentials (Auto-fill)</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-[#6F7682] mt-6">
          Protected by JWT authentication and role-based permissions framework.
        </p>
      </div>
    </div>
  );
}
