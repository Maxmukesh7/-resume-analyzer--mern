import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
  FiUsers,
  FiFileText,
  FiActivity,
  FiCpu,
  FiTarget,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiArrowUpRight,
  FiRefreshCw
} from 'react-icons/fi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await adminService.getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-900 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Registered Users', value: data?.totalUsers || 0, icon: FiUsers, color: 'from-blue-500 to-indigo-600', link: '/admin/users' },
    { title: 'Total Uploaded Resumes', value: data?.totalUploadedResumes || 0, icon: FiFileText, color: 'from-emerald-500 to-teal-600', link: '/admin/resumes' },
    { title: 'Total Resume Analyses (ATS)', value: data?.totalResumeAnalyses || 0, icon: FiActivity, color: 'from-purple-500 to-indigo-600', link: '/admin/analytics' },
    { title: 'Total AI Analyses', value: data?.totalAiAnalyses || 0, icon: FiCpu, color: 'from-amber-500 to-orange-600', link: '/admin/analytics' },
    { title: 'Total Job Match Scans', value: data?.totalJobMatchAnalyses || 0, icon: FiTarget, color: 'from-rose-500 to-pink-600', link: '/admin/analytics' },
    { title: 'Total Resume Improvements', value: data?.totalResumeImprovements || 0, icon: FiZap, color: 'from-cyan-500 to-blue-600', link: '/admin/analytics' },
    { title: 'Total Administrators', value: data?.totalAdmins || 0, icon: FiShield, color: 'from-indigo-500 to-violet-600', link: '/admin/users?role=admin' },
    { title: 'Active Users', value: data?.activeUsers || 0, icon: FiCheckCircle, color: 'from-emerald-500 to-green-600', link: '/admin/users?status=active' }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Admin Overview</span>
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
              Live Systems
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry and management metrics across user scans, resumes, and AI requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-700/60"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Today Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Today's Registrations</p>
            <p className="text-3xl font-extrabold text-white mt-1">{data?.todaysRegistrations || 0}</p>
            <p className="text-xs text-slate-400 mt-1">New accounts created today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Today's Uploads</p>
            <p className="text-3xl font-extrabold text-white mt-1">{data?.todaysUploads || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Resumes processed today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FiFileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Core Platform Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(card.link)}
                className="group p-5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <FiArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-2xl font-black text-white tracking-tight">{card.value.toLocaleString()}</p>
                <p className="text-xs font-medium text-slate-400 mt-1">{card.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed & Quick System Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Log */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiClock className="w-5 h-5 text-indigo-400" />
                <span>Recent System Activity</span>
              </h2>
              <p className="text-xs text-slate-400">Live feed of user actions and admin operations</p>
            </div>
            <button
              onClick={() => navigate('/admin/activity')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              View All Logs →
            </button>
          </div>

          <div className="space-y-3">
            {data?.recentActivity?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent activity logged yet.</p>
            ) : (
              data?.recentActivity?.map((act) => (
                <div
                  key={act._id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                      {act.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{act.action}</p>
                      <p className="text-slate-400 truncate">{act.description || act.user?.email || 'System Action'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap ml-2">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Diagnostics Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <FiShield className="w-5 h-5 text-emerald-400" />
              <span>System Health</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Backend and DB connection status</p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">MongoDB Database</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  {data?.systemHealth?.mongoStatus || 'Connected'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Express API Engine</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  {data?.systemHealth?.serverStatus || 'Online'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Uptime Counter</span>
                <span className="text-xs font-mono text-indigo-400 font-bold">
                  {Math.floor((data?.systemHealth?.uptimeSeconds || 0) / 60)} mins
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/settings')}
            className="w-full mt-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700/60"
          >
            Open Full Health Diagnostics →
          </button>
        </div>
      </div>
    </div>
  );
}
