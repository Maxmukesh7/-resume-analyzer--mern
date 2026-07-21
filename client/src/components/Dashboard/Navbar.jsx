import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaSearch, FaBell, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { mockUser, mockNotifications } from '../../utils/mockData';

export default function Navbar({ onToggleSidebar }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 right-0 left-0 bg-slate-950/75 backdrop-blur-md border-b border-slate-800/60 z-30 px-6 py-4 flex items-center justify-between">
      {/* Left side: Sidebar Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl lg:hidden transition-colors"
          aria-label="Toggle Sidebar"
        >
          <FaBars size={18} />
        </button>

        {/* Search Bar */}
        <div className="relative max-w-md w-full hidden md:block">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search resume history, reports, settings..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/40 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all text-xs"
          />
        </div>
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/60 rounded-xl transition-all relative"
            aria-label="Notifications"
          >
            <FaBell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden z-40">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider transition-colors"
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
                      className={`px-5 py-3.5 border-b border-slate-850/50 hover:bg-slate-800/20 transition-all flex flex-col gap-1.5
                        ${!notif.read ? 'bg-blue-900/5' : ''}`}
                    >
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {notif.text}
                      </p>
                      <span className="text-[10px] text-slate-500 font-semibold">{notif.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-slate-500 text-xs">
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
            className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-800/60 hover:bg-slate-900 transition-all"
          >
            <img
              src={mockUser.avatar}
              alt="User avatar"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="text-xs font-bold text-slate-300 hidden sm:block pr-1">
              {mockUser.name}
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden z-40">
              {/* Profile Overview */}
              <div className="px-5 py-4 border-b border-slate-800">
                <p className="text-xs font-extrabold text-white truncate">{mockUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{mockUser.email}</p>
              </div>

              {/* Menu Links */}
              <div className="py-2">
                <Link
                  to="/dashboard/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
                >
                  <FaUser size={13} />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
                >
                  <FaCog size={13} />
                  <span>Account Settings</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-800 py-1 bg-slate-900/50">
                <Link
                  to="/login"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 transition-colors"
                >
                  <FaSignOutAlt size={13} />
                  <span>Logout</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
