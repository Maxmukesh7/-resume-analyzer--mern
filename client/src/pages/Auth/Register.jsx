import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaRobot } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms & conditions';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(newErrors.terms || 'Please fix the errors in the form.', 'error');
      return;
    }

    setErrors({});
    setLoading(true);

    const result = await register(fullName, email, password, confirmPassword);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden font-sans">
      {/* Background neon glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#F5B83D]/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#FFD166]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Logo header */}
      <Link to="/" className="flex items-center gap-3.5 mb-8 z-10 group">
        <div className="p-2.5 bg-gradient-to-tr from-[#F5B83D] to-[#FFD166] rounded-2xl text-[#08090B] shadow-[0_0_20px_rgba(245,184,61,0.35)]">
          <FaRobot size={24} className="group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <span className="text-2xl font-extrabold text-[#F5F5F5] tracking-wide">
          AI Resume <span className="bg-gradient-to-r from-[#F5B83D] to-[#FFD166] bg-clip-text text-transparent">Analyzer</span>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="p-8 bg-[#121519] border-[#292D33]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-wide">Create an Account</h2>
            <p className="text-[#A7ADB7] text-sm mt-1.5 font-medium">Start optimizing your job search today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <Input
              id="reg-name"
              label="Full Name"
              type="text"
              placeholder="e.g. Mukesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />

            <Input
              id="reg-email"
              label="Email Address"
              type="email"
              placeholder="e.g. mukesh.kumar@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              id="reg-pass"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <Input
              id="reg-confirm"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />

            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2.5 text-[#A7ADB7] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-[#0D0F12] border-[#292D33] focus:ring-[#F5B83D]/30 text-[#F5B83D] focus:outline-none transition-all cursor-pointer"
                />
                <span className="text-xs leading-relaxed font-semibold">
                  I accept the{' '}
                  <a href="#terms" className="text-[#F5B83D] hover:text-[#FFD166] font-bold transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-[#F5B83D] hover:text-[#FFD166] font-bold transition-colors">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.terms && <span className="text-xs text-rose-400 mt-1 font-medium">{errors.terms}</span>}
            </div>

            <Button type="submit" className="w-full mt-2" loading={loading}>
              Sign Up
            </Button>
          </form>

          {/* Footnotes */}
          <p className="text-[#A7ADB7] text-xs text-center mt-8 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F5B83D] hover:text-[#FFD166] font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
