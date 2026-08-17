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
    <div className="h-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex-none flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            <FiShield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white">Admin Hub</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 focus:outline-none"
        >
          {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-40 transition-transform duration-300 md:h-full md:overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800/80 hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide text-base">Admin Portal</h2>
              <p className="text-xs text-indigo-400 font-medium">AI Resume Analyzer</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-2">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {location.pathname === item.path && <FiChevronRight className="w-4 h-4 text-indigo-200" />}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Administrator'}</p>
                <p className="text-[11px] text-indigo-400 truncate font-mono">Role: Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout from Admin Portal"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 flex-none bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Live
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline-block">
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
                className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/50"
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-white">System Alerts & Notifications</h3>
                    <span className="text-xs text-slate-400">{notifications.length} recent</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-500">No recent system notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3.5 hover:bg-slate-800/40 transition-colors flex gap-3">
                          <div className="mt-0.5">
                            {notif.type === 'alert' ? (
                              <FiAlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <FiCheckCircle className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200">{notif.title}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{notif.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
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
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700/50"
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
