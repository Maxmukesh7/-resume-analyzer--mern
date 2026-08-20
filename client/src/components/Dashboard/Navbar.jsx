import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaSearch, FaBell, FaUser, FaSignOutAlt, FaCog, FaMoon, FaSun } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getFileUrl } from '../../services/api';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Welcome to AI Resume Analyzer. Upload a resume to get full ATS & Gemini insights.', time: 'Just now', read: false }
  ]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 right-0 left-0 bg-[#08090B]/90 backdrop-blur-md border-b border-[#292D33] z-30 px-6 py-4 flex items-center justify-between">
      {/* Left side: Sidebar Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#121519] rounded-xl lg:hidden transition-colors cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <FaBars size={18} />
        </button>

        {/* Search Bar */}
        <div className="relative max-w-md w-full hidden md:block">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F7682]" size={14} />
          <input
            type="text"
            placeholder="Search resume history, reports, settings..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D]/25 transition-all text-xs"
          />
        </div>
      </div>

      {/* Right side: Theme Toggle, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#121519] border border-[#292D33] rounded-xl transition-all cursor-pointer"
          aria-label="Toggle Dark/Light Mode"
        >
          {darkMode ? (
            <FaSun size={15} className="text-[#F5B83D] hover:rotate-45 transition-transform duration-300" />
          ) : (
            <FaMoon size={15} className="text-[#FFD166] hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#121519] border border-[#292D33] rounded-xl transition-all relative cursor-pointer"
            aria-label="Notifications"
          >
            <FaBell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-[#F5B83D] to-[#FFD166] rounded-full animate-pulse shadow-[0_0_8px_rgba(245,184,61,0.8)]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#121519] border border-[#292D33] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden z-40">
              <div className="px-5 py-4 border-b border-[#292D33] flex items-center justify-between">
                <span className="text-sm font-bold text-[#F5F5F5]">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-[#F5B83D] hover:text-[#FFD166] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-5 py-3.5 border-b border-[#292D33]/50 hover:bg-[#171A1F] transition-all flex flex-col gap-1.5
                        ${!notif.read ? 'bg-[#F5B83D]/10' : ''}`}
                    >
                      <p className="text-xs text-[#F5F5F5] font-medium leading-relaxed">
                        {notif.text}
                      </p>
                      <span className="text-[10px] text-[#A7ADB7] font-semibold">{notif.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-[#6F7682] text-xs">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl border border-[#292D33] hover:bg-[#121519] transition-all cursor-pointer"
          >
            <img
              src={getFileUrl(user?.avatar) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
              alt="User avatar"
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";
              }}
            />
            <span className="text-xs font-bold text-[#F5F5F5] hidden sm:block pr-1">
              {user?.fullName || "User"}
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-[#121519] border border-[#292D33] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden z-40">
              {/* Profile Overview */}
              <div className="px-5 py-4 border-b border-[#292D33]">
                <p className="text-xs font-extrabold text-[#F5F5F5] truncate">{user?.fullName || "User"}</p>
                <p className="text-[10px] text-[#A7ADB7] truncate mt-0.5">{user?.email}</p>
              </div>

              {/* Menu Links */}
              <div className="py-2">
                <Link
                  to="/dashboard/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-xs text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#171A1F] transition-colors"
                >
                  <FaUser size={13} className="text-[#F5B83D]" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-xs text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#171A1F] transition-colors"
                >
                  <FaCog size={13} className="text-[#FFD166]" />
                  <span>Account Settings</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-[#292D33] py-1 bg-[#0D0F12]">
                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                >
                  <FaSignOutAlt size={13} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
