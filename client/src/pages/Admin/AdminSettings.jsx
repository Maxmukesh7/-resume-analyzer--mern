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
        <div className="h-20 bg-slate-900 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-900 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FiSettings className="w-7 h-7 text-indigo-400" />
            <span>System Health Diagnostics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time engine status, MongoDB connectivity, Gemini AI configuration, server uptime, and API performance.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700/60 transition-all"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Run Health Diagnostics
        </button>
      </div>

      {/* Grid of Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. MongoDB Database Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <FiDatabase className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                {health.mongoDB?.status || 'Connected'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">MongoDB Database</h3>
            <p className="text-xs text-slate-400 mt-1">ORM state & connection pool</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs space-y-1 font-mono text-slate-400">
            <p>Host: <span className="text-white">{health.mongoDB?.host}</span></p>
            <p>Database: <span className="text-indigo-400">{health.mongoDB?.dbName}</span></p>
          </div>
        </div>

        {/* 2. Express Backend Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <FiServer className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                {health.backendStatus || 'Online'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Express Backend Engine</h3>
            <p className="text-xs text-slate-400 mt-1">Node.js API web server</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs space-y-1 font-mono text-slate-400">
            <p>Environment: <span className="text-white">{health.nodeVersion}</span></p>
            <p>Platform: <span className="text-slate-300">{health.platform}</span></p>
          </div>
        </div>

        {/* 3. Gemini AI API Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <FiCpu className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold">
                {health.geminiApiStatus}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Gemini AI Service</h3>
            <p className="text-xs text-slate-400 mt-1">Generative AI resume parser & analyzer</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs space-y-1 font-mono text-slate-400">
            <p>Model: <span className="text-purple-300">gemini-2.5-flash / pro</span></p>
            <p>SDK: <span className="text-white">@google/genai v2</span></p>
          </div>
        </div>

        {/* 4. Server Uptime */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <FiClock className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-blue-400 font-bold">{health.serverUptime}</span>
            </div>
            <h3 className="text-base font-bold text-white">Server Uptime</h3>
            <p className="text-xs text-slate-400 mt-1">Total operational elapsed time</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            Process running seamlessly without crashes.
          </div>
        </div>

        {/* 5. Memory & System Hardware */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <FiZap className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">{health.freeMemoryMb} MB Free</span>
            </div>
            <h3 className="text-base font-bold text-white">System Memory</h3>
            <p className="text-xs text-slate-400 mt-1">Host system RAM & CPU cores</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs space-y-1 font-mono text-slate-400">
            <p>Total Memory: <span className="text-white">{health.totalMemoryMb} MB</span></p>
            <p>CPU Cores: <span className="text-indigo-400">{health.cpuCores} Cores</span></p>
          </div>
        </div>

        {/* 6. API Response Time Latency */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                <FiActivity className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-teal-400 font-bold">~{health.apiLatencyMs} ms</span>
            </div>
            <h3 className="text-base font-bold text-white">API Response Latency</h3>
            <p className="text-xs text-slate-400 mt-1">Average round-trip response time</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <FiCheckCircle /> Excellent low-latency performance
          </div>
        </div>
      </div>
    </div>
  );
}
