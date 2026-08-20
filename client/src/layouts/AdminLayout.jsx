import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import {
  FiGrid,
  FiUsers,
  FiFileText,
  FiBarChart2,
  FiActivity,
  FiSettings,
  FiLogOut,
  FiBell,
  FiShield,
  FiMenu,
  FiX,
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronRight,
  FiAward
} from 'react-icons/fi';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await adminService.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiGrid },
    { name: 'User Management', path: '/admin/users', icon: FiUsers },
    { name: 'Resume Repository', path: '/admin/resumes', icon: FiFileText },
    { name: 'Candidate Ranking', path: '/admin/rankings', icon: FiAward },
    { name: 'Analytics', path: '/admin/analytics', icon: FiBarChart2 },
    { name: 'Activity Logs', path: '/admin/activity', icon: FiActivity },
    { name: 'System Health', path: '/admin/settings', icon: FiSettings }
  ];

  return (
    <div className="relative h-screen h-[100dvh] bg-[#08090B] text-[#F5F5F5] flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex-none flex items-center justify-between px-4 py-3 bg-[#0D0F12] border-b border-[#292D33] z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5B83D] to-[#FFD166] flex items-center justify-center text-[#08090B] font-bold">
            <FiShield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-[#F5F5F5]">Admin Hub</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#A7ADB7] hover:text-[#F5F5F5] rounded-lg bg-[#121519] focus:outline-none"
        >
          {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-[#0D0F12] border-r border-[#292D33] flex flex-col justify-between z-40 transition-transform duration-300 md:h-full md:overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-[#292D33] hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5B83D] to-[#FFD166] flex items-center justify-center text-[#08090B] shadow-lg shadow-[#F5B83D]/25 font-bold">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-[#F5F5F5] tracking-wide text-base">Admin Portal</h2>
              <p className="text-xs text-[#F5B83D] font-medium">AI Resume Analyzer</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-2">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#6F7682]">
              Core Administration
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166] text-[#08090B] font-bold shadow-lg shadow-[#F5B83D]/25'
                        : 'text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#121519]'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {location.pathname === item.path && <FiChevronRight className="w-4 h-4 text-[#08090B]" />}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#292D33]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121519] border border-[#292D33]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#F5B83D]/20 border border-[#F5B83D]/30 flex items-center justify-center text-[#FFD166] font-bold text-sm">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#F5F5F5] truncate">{user?.fullName || 'Administrator'}</p>
                <p className="text-[11px] text-[#F5B83D] truncate font-mono">Role: Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout from Admin Portal"
              className="p-2 text-[#A7ADB7] hover:text-rose-400 hover:bg-[#171A1F] rounded-lg transition-colors cursor-pointer"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 flex-none bg-[#0D0F12]/80 backdrop-blur-md border-b border-[#292D33] px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-[#F5B83D]/10 border border-[#F5B83D]/30 text-[#F5B83D] text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F5B83D] animate-pulse"></span>
              System Live
            </span>
            <span className="text-xs text-[#A7ADB7] hidden sm:inline-block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) setUnreadCount(0);
                }}
                className="relative p-2 text-[#A7ADB7] hover:text-[#F5F5F5] bg-[#121519] hover:bg-[#171A1F] rounded-xl transition-all border border-[#292D33] cursor-pointer"
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F5B83D] text-[#08090B] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0D0F12]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#121519] border border-[#292D33] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                  <div className="p-4 border-b border-[#292D33] flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-[#F5F5F5]">System Alerts & Notifications</h3>
                    <span className="text-xs text-[#A7ADB7]">{notifications.length} recent</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#292D33]/60">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-xs text-[#6F7682]">No recent system notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3.5 hover:bg-[#171A1F] transition-colors flex gap-3">
                          <div className="mt-0.5">
                            {notif.type === 'alert' ? (
                              <FiAlertTriangle className="w-4 h-4 text-[#F5B83D]" />
                            ) : (
                              <FiCheckCircle className="w-4 h-4 text-[#4ADE80]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#F5F5F5]">{notif.title}</p>
                            <p className="text-xs text-[#A7ADB7] truncate mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-[#6F7682] mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick User Return to Normal Dashboard link */}
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-1.5 text-xs font-medium text-[#A7ADB7] hover:text-[#F5F5F5] bg-[#121519] hover:bg-[#171A1F] rounded-xl transition-all border border-[#292D33] cursor-pointer"
            >
              Exit to User Portal
            </button>
          </div>
        </header>

        {/* Dynamic Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
