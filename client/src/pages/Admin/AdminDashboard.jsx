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
        <div className="h-20 bg-[#121519] rounded-2xl border border-[#292D33]"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-[#121519] rounded-2xl border border-[#292D33]"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Registered Users', value: data?.totalUsers || 0, icon: FiUsers, color: 'from-[#F5B83D] to-[#FFD166]', link: '/admin/users' },
    { title: 'Total Uploaded Resumes', value: data?.totalUploadedResumes || 0, icon: FiFileText, color: 'from-[#FFD166] to-[#F5B83D]', link: '/admin/resumes' },
    { title: 'Total Resume Analyses (ATS)', value: data?.totalResumeAnalyses || 0, icon: FiActivity, color: 'from-[#F5B83D] to-[#B7791F]', link: '/admin/analytics' },
    { title: 'Total AI Analyses', value: data?.totalAiAnalyses || 0, icon: FiCpu, color: 'from-[#FFD166] to-[#B7791F]', link: '/admin/analytics' },
    { title: 'Total Job Match Scans', value: data?.totalJobMatchAnalyses || 0, icon: FiTarget, color: 'from-[#F5B83D] to-[#FFD166]', link: '/admin/analytics' },
    { title: 'Total Resume Improvements', value: data?.totalResumeImprovements || 0, icon: FiZap, color: 'from-[#FFD166] to-[#F5B83D]', link: '/admin/analytics' },
    { title: 'Total Administrators', value: data?.totalAdmins || 0, icon: FiShield, color: 'from-[#B7791F] to-[#F5B83D]', link: '/admin/users?role=admin' },
    { title: 'Active Users', value: data?.activeUsers || 0, icon: FiCheckCircle, color: 'from-[#4ADE80] to-[#22C55E]', link: '/admin/users?status=active' }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121519] border border-[#292D33] p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight flex items-center gap-3">
            <span>Admin Overview</span>
            <span className="text-xs px-3 py-1 rounded-full bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] font-semibold">
              Live Systems
            </span>
          </h1>
          <p className="text-sm text-[#A7ADB7] mt-1">
            Real-time telemetry and management metrics across user scans, resumes, and AI requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] hover:text-[#FFD166] text-xs font-semibold flex items-center gap-2 transition-all border border-[#292D33] cursor-pointer"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Today Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171A1F] to-[#121519] border border-[#F5B83D]/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#FFD166] uppercase tracking-wider">Today's Registrations</p>
            <p className="text-3xl font-extrabold text-[#F5F5F5] mt-1">{data?.todaysRegistrations || 0}</p>
            <p className="text-xs text-[#A7ADB7] mt-1">New accounts created today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F5B83D]/15 border border-[#F5B83D]/30 flex items-center justify-center text-[#FFD166]">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171A1F] to-[#121519] border border-[#FFD166]/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#FFD166] uppercase tracking-wider">Today's Uploads</p>
            <p className="text-3xl font-extrabold text-[#F5F5F5] mt-1">{data?.todaysUploads || 0}</p>
            <p className="text-xs text-[#A7ADB7] mt-1">Resumes processed today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FFD166]/15 border border-[#FFD166]/30 flex items-center justify-center text-[#FFD166]">
            <FiFileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div>
        <h2 className="text-lg font-bold text-[#F5F5F5] mb-4">Core Platform Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(card.link)}
                className="group p-5 bg-[#121519] hover:bg-[#171A1F] border border-[#292D33] hover:border-[#F5B83D]/40 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-[#08090B] font-bold shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <FiArrowUpRight className="w-4 h-4 text-[#6F7682] group-hover:text-[#FFD166] transition-colors" />
                </div>
                <p className="text-2xl font-black text-[#F5F5F5] tracking-tight">{card.value.toLocaleString()}</p>
                <p className="text-xs font-medium text-[#A7ADB7] mt-1">{card.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed & Quick System Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Log */}
        <div className="lg:col-span-2 bg-[#121519] border border-[#292D33] rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <FiClock className="w-5 h-5 text-[#F5B83D]" />
                <span>Recent System Activity</span>
              </h2>
              <p className="text-xs text-[#A7ADB7]">Live feed of user actions and admin operations</p>
            </div>
            <button
              onClick={() => navigate('/admin/activity')}
              className="text-xs font-semibold text-[#FFD166] hover:text-[#F5B83D] cursor-pointer"
            >
              View All Logs →
            </button>
          </div>

          <div className="space-y-3">
            {data?.recentActivity?.length === 0 ? (
              <p className="text-xs text-[#6F7682] py-6 text-center">No recent activity logged yet.</p>
            ) : (
              data?.recentActivity?.map((act) => (
                <div
                  key={act._id}
                  className="p-3.5 rounded-xl bg-[#0D0F12] border border-[#292D33] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] flex items-center justify-center font-bold">
                      {act.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#F5F5F5] truncate">{act.action}</p>
                      <p className="text-[#A7ADB7] truncate">{act.description || act.user?.email || 'System Action'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#6F7682] font-mono whitespace-nowrap ml-2">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Diagnostics Box */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-1 flex items-center gap-2">
              <FiShield className="w-5 h-5 text-[#F5B83D]" />
              <span>System Health</span>
            </h2>
            <p className="text-xs text-[#A7ADB7] mb-6">Backend and DB connection status</p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0D0F12] border border-[#292D33] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F5]">MongoDB Database</span>
                <span className="px-2.5 py-1 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] text-xs font-bold border border-[#4ADE80]/30">
                  {data?.systemHealth?.mongoStatus || 'Connected'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D0F12] border border-[#292D33] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F5]">Express API Engine</span>
                <span className="px-2.5 py-1 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] text-xs font-bold border border-[#4ADE80]/30">
                  {data?.systemHealth?.serverStatus || 'Online'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D0F12] border border-[#292D33] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F5]">Uptime Counter</span>
                <span className="text-xs font-mono text-[#FFD166] font-bold">
                  {Math.floor((data?.systemHealth?.uptimeSeconds || 0) / 60)} mins
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/settings')}
            className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#FFD166] hover:to-[#F5B83D] text-[#08090B] font-bold text-xs transition-all cursor-pointer shadow-lg"
          >
            Open Full Health Diagnostics →
          </button>
        </div>
      </div>
    </div>
  );
}
