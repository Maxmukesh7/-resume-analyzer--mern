import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCheckCircle, FaRobot } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email address is required');
      showToast('Please enter your email.', 'error');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      showToast('Please enter a valid email.', 'error');
      return;
    }

    setError('');
    setLoading(true);

    // Simulate sending email verification link
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      showToast('Reset email sent successfully!', 'success');
    }, 1200);
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
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-wide">Reset Password</h2>
                <p className="text-[#A7ADB7] text-sm mt-1.5 font-medium">
                  We will email you link instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  id="reset-email"
                  label="Email Address"
                  type="email"
                  placeholder="e.g. mukesh.kumar@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4"
            >
              <div className="flex justify-center mb-5 text-[#4ADE80]">
                <FaCheckCircle size={48} className="drop-shadow-[0_0_15px_rgba(74,222,128,0.3)] animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-wide">Link Sent!</h2>
              <p className="text-[#A7ADB7] text-sm mt-3.5 leading-relaxed font-medium">
                We've successfully sent a password reset link to <br />
                <span className="text-[#F5B83D] font-bold">{email}</span>. <br />
                Please inspect your spam folder if you do not receive it in a few minutes.
              </p>

              <Button
                variant="secondary"
                className="mt-8 w-full"
                onClick={() => setSubmitted(false)}
              >
                Resend Link
              </Button>
            </motion.div>
          )}

          {/* Go Back arrow link */}
          <div className="border-t border-[#292D33] pt-6 mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#A7ADB7] hover:text-[#F5F5F5] transition-colors"
            >
              <FaArrowLeft size={10} />
              <span>Back to Login</span>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
