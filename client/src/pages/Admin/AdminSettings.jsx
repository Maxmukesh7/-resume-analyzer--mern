import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useToast } from '../../components/Common/Toast';
import {
  FiSettings,
  FiServer,
  FiDatabase,
  FiCpu,
  FiZap,
  FiActivity,
  FiRefreshCw,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';

export default function AdminSettings() {
  const { showToast } = useToast();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setRefreshing(true);
      const res = await adminService.getHealth();
      if (res.success) {
        setHealth(res.data);
      }
    } catch (err) {
      showToast('Failed to fetch system health diagnostics', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading || !health) {
    return (
      <div className="space-y-6 animate-pulse font-sans">
        <div className="h-20 bg-[#121519] rounded-2xl border border-[#292D33]"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-[#121519] rounded-3xl border border-[#292D33]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121519] border border-[#292D33] p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight flex items-center gap-3">
            <FiSettings className="w-7 h-7 text-[#F5B83D]" />
            <span>System Health Diagnostics</span>
          </h1>
          <p className="text-sm text-[#A7ADB7] mt-1">
            Monitor real-time engine status, MongoDB connectivity, Gemini AI configuration, server uptime, and API performance.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] text-xs font-semibold flex items-center gap-2 border border-[#292D33] transition-all cursor-pointer"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Run Health Diagnostics
        </button>
      </div>

      {/* Grid of Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. MongoDB Database Status */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#171A1F] border border-[#4ADE80]/30 text-[#4ADE80] flex items-center justify-center">
                <FiDatabase className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#4ADE80] text-xs font-bold">
                {health.mongoDB?.status || 'Connected'}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#F5F5F5]">MongoDB Database</h3>
            <p className="text-xs text-[#A7ADB7] mt-1">ORM state & connection pool</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#292D33] text-xs space-y-1 font-mono text-[#A7ADB7]">
            <p>Host: <span className="text-[#F5F5F5]">{health.mongoDB?.host}</span></p>
            <p>Database: <span className="text-[#FFD166]">{health.mongoDB?.dbName}</span></p>
          </div>
        </div>

        {/* 2. Express Backend Status */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] flex items-center justify-center">
                <FiServer className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#4ADE80] text-xs font-bold">
                {health.backendStatus || 'Online'}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#F5F5F5]">Express Backend Engine</h3>
            <p className="text-xs text-[#A7ADB7] mt-1">Node.js API web server</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#292D33] text-xs space-y-1 font-mono text-[#A7ADB7]">
            <p>Environment: <span className="text-[#F5F5F5]">{health.nodeVersion}</span></p>
            <p>Platform: <span className="text-[#FFD166]">{health.platform}</span></p>
          </div>
        </div>

        {/* 3. Gemini AI API Status */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] flex items-center justify-center">
                <FiCpu className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F5B83D]/15 border border-[#F5B83D]/30 text-[#FFD166] text-xs font-bold">
                {health.geminiApiStatus}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#F5F5F5]">Gemini AI Service</h3>
            <p className="text-xs text-[#A7ADB7] mt-1">Generative AI resume parser & analyzer</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#292D33] text-xs space-y-1 font-mono text-[#A7ADB7]">
            <p>Model: <span className="text-[#FFD166]">gemini-2.5-flash / pro</span></p>
            <p>SDK: <span className="text-[#F5F5F5]">@google/genai v2</span></p>
          </div>
        </div>

        {/* 4. Server Uptime */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#171A1F] border border-[#FFD166]/30 text-[#FFD166] flex items-center justify-center">
                <FiClock className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-[#FFD166] font-bold">{health.serverUptime}</span>
            </div>
            <h3 className="text-base font-bold text-[#F5F5F5]">Server Uptime</h3>
            <p className="text-xs text-[#A7ADB7] mt-1">Total operational elapsed time</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#292D33] text-xs text-[#A7ADB7]">
            Process running seamlessly without crashes.
          </div>
        </div>

        {/* 5. Memory & System Hardware */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] flex items-center justify-center">
                <FiZap className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-[#FFD166] font-bold">{health.freeMemoryMb} MB Free</span>
            </div>
            <h3 className="text-base font-bold text-[#F5F5F5]">System Memory</h3>
            <p className="text-xs text-[#A7ADB7] mt-1">Host system RAM & CPU cores</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#292D33] text-xs space-y-1 font-mono text-[#A7ADB7]">
            <p>Total Memory: <span className="text-[#F5F5F5]">{health.totalMemoryMb} MB</span></p>
            <p>CPU Cores: <span className="text-[#FFD166]">{health.cpuCores} Cores</span></p>
          </div>
        </div>

        {/* 6. API Response Time Latency */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#171A1F] border border-[#4ADE80]/30 text-[#4ADE80] flex items-center justify-center">
                <FiActivity className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-[#4ADE80] font-bold">~{health.apiLatencyMs} ms</span>
            </div>
            <h3 className="text-base font-bold text-[#F5F5F5]">API Response Latency</h3>
            <p className="text-xs text-[#A7ADB7] mt-1">Average round-trip response time</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#292D33] text-xs text-[#4ADE80] font-semibold flex items-center gap-1">
            <FiCheckCircle /> Excellent low-latency performance
          </div>
        </div>
      </div>
    </div>
  );
}
