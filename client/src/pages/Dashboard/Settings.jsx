import { useState } from 'react';
import { FaPalette, FaLock, FaTrashAlt, FaMoon, FaSun } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Settings() {
  const { showToast } = useToast();
  const { changePassword } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleToggleDarkMode = () => {
    toggleDarkMode();
    showToast(`Theme switched to ${darkMode ? 'Light Mode' : 'Dark Mode'}!`, 'info');
  };

  const handleDeleteAccount = () => {
    const confirmation = window.confirm('WARNING: Are you sure you want to permanently delete your account? This action is irreversible.');
    if (confirmation) {
      showToast('Account delete request sent to admin pipeline.', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Confirm password does not match.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword, confirmPassword);
    setPasswordLoading(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully!', 'success');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">Account Settings</h1>
        <p className="text-slate-400 text-xs mt-1.5 font-semibold">
          Configure display preferences and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance / Theme Settings */}
        <Card className="p-8 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <FaPalette size={13} className="text-blue-400" />
            <span>Theme & Display</span>
          </h3>

          <div className="space-y-6">
            {/* Dark Mode Switch */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  {darkMode ? <FaMoon size={12} className="text-blue-400" /> : <FaSun size={12} className="text-amber-400" />}
                  Dark Mode Theme
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                  {darkMode ? 'Use low-contrast dark system backgrounds' : 'Use high-contrast clean light backgrounds'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={handleToggleDarkMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-sm
                  ${darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out
                    ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Security & Access / Change Password */}
        <Card className="p-8 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <FaLock size={13} className="text-amber-400" />
            <span>Change Password</span>
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" loading={passwordLoading} size="sm" className="w-full mt-2">
              Update Password
            </Button>
          </form>
        </Card>

        {/* Dangerous Operations */}
        <Card className="p-8 space-y-6 md:col-span-2 border border-red-950/20 bg-slate-900/10">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2.5 border-b border-red-950/25 pb-3">
            <FaTrashAlt size={13} />
            <span>Dangerous Zones</span>
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Deactivate & Remove Account</span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Permanently deletes all history logs, reports, and credential metadata files</span>
            </div>
            <Button
              onClick={handleDeleteAccount}
              variant="danger"
              size="sm"
            >
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
