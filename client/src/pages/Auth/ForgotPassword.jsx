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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden font-sans">
      {/* Background neon glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-900/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Logo header */}
      <Link to="/" className="flex items-center gap-3.5 mb-8 z-10 group">
        <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
          <FaRobot size={24} className="group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <span className="text-2xl font-extrabold text-white tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          AI Resume <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Analyzer</span>
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="p-8">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white tracking-wide">Reset Password</h2>
                <p className="text-slate-400 text-sm mt-1.5 font-medium">
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
              <div className="flex justify-center mb-5 text-emerald-400">
                <FaCheckCircle size={48} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">Link Sent!</h2>
              <p className="text-slate-400 text-sm mt-3.5 leading-relaxed font-medium">
                We've successfully sent a password reset link to <br />
                <span className="text-blue-400 font-bold">{email}</span>. <br />
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
          <div className="border-t border-slate-800/80 pt-6 mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
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
