import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { useToast } from '../../components/Common/Toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FiBarChart2, FiDownload, FiCalendar } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminAnalytics() {
  const { showToast } = useToast();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAnalytics({ days });
      if (res.success) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      showToast('Failed to load analytics charts data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="space-y-6 animate-pulse font-sans">
        <div className="h-20 bg-slate-900 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900 rounded-3xl"></div>
          <div className="h-64 bg-slate-900 rounded-3xl"></div>
          <div className="h-64 bg-slate-900 rounded-3xl"></div>
          <div className="h-64 bg-slate-900 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  // 1. Daily Registrations Chart Config
  const dailyRegChartData = {
    labels: analyticsData.dailyRegistrations?.labels || [],
    datasets: [
      {
        label: 'Daily Registrations',
        data: analyticsData.dailyRegistrations?.data || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // 2. Daily Resume Uploads Chart Config
  const dailyUploadsChartData = {
    labels: analyticsData.dailyUploads?.labels || [],
    datasets: [
      {
        label: 'Resume Uploads',
        data: analyticsData.dailyUploads?.data || [],
        backgroundColor: '#10b981',
        borderRadius: 8
      }
    ]
  };

  // 3. ATS Score Distribution Config
  const atsLabels = Object.keys(analyticsData.atsDistribution || {});
  const atsValues = Object.values(analyticsData.atsDistribution || {});
  const atsDistributionChartData = {
    labels: atsLabels,
    datasets: [
      {
        data: atsValues,
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
        borderWidth: 2,
        borderColor: '#0f172a'
      }
    ]
  };

  // 4. Most Common Skills Extracted Config
  const skillLabels = (analyticsData.topSkills || []).map((s) => s.skill.toUpperCase());
  const skillCounts = (analyticsData.topSkills || []).map((s) => s.count);
  const topSkillsChartData = {
    labels: skillLabels,
    datasets: [
      {
        label: 'Frequency Extracted',
        data: skillCounts,
        backgroundColor: '#8b5cf6',
        borderRadius: 6
      }
    ]
  };

  // 5. Most Common Missing Skills Config
  const missingLabels = (analyticsData.topMissingSkills || []).map((s) => s.skill.toUpperCase());
  const missingCounts = (analyticsData.topMissingSkills || []).map((s) => s.count);
  const topMissingSkillsChartData = {
    labels: missingLabels,
    datasets: [
      {
        label: 'Times Missing in ATS Scans',
        data: missingCounts,
        backgroundColor: '#f43f5e',
        borderRadius: 6
      }
    ]
  };

  // 6. Job Match Distribution Config
  const jmLabels = Object.keys(analyticsData.jobMatchDistribution || {});
  const jmValues = Object.values(analyticsData.jobMatchDistribution || {});
  const jobMatchDistributionChartData = {
    labels: jmLabels,
    datasets: [
      {
        data: jmValues,
        backgroundColor: ['#f43f5e', '#f59e0b', '#6366f1', '#10b981'],
        borderWidth: 2,
        borderColor: '#0f172a'
      }
    ]
  };

  // Export Analytics Summary
  const handleExportCSV = () => {
    const dataToExport = [
      { Metric: 'Total ATS Scans', Value: analyticsData.aiStats?.atsScans || 0 },
      { Metric: 'Total AI Analyses', Value: analyticsData.aiStats?.aiAnalyses || 0 },
      { Metric: 'Total Job Match Scans', Value: analyticsData.aiStats?.jobMatches || 0 },
      { Metric: 'Total Resume Improvements', Value: analyticsData.aiStats?.improvements || 0 }
    ];
    exportToCSV(dataToExport, 'analytics-metrics.csv');
  };

  const handleExportExcel = () => {
    const dataToExport = [
      { Metric: 'Total ATS Scans', Value: analyticsData.aiStats?.atsScans || 0 },
      { Metric: 'Total AI Analyses', Value: analyticsData.aiStats?.aiAnalyses || 0 },
      { Metric: 'Total Job Match Scans', Value: analyticsData.aiStats?.jobMatches || 0 },
      { Metric: 'Total Resume Improvements', Value: analyticsData.aiStats?.improvements || 0 }
    ];
    exportToExcel(dataToExport, 'analytics-metrics.xlsx');
  };

  const handleExportPDF = () => {
    const headers = ['Analytics Metric', 'Recorded Value'];
    const rows = [
      ['Total ATS Scans', (analyticsData.aiStats?.atsScans || 0).toString()],
      ['Total AI Analyses', (analyticsData.aiStats?.aiAnalyses || 0).toString()],
      ['Total Job Match Scans', (analyticsData.aiStats?.jobMatches || 0).toString()],
      ['Total Resume Improvements', (analyticsData.aiStats?.improvements || 0).toString()]
    ];
    exportToPDF('Analytics Telemetry Summary', headers, rows, 'analytics-summary.pdf');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } }
      }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } }
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FiBarChart2 className="w-7 h-7 text-indigo-400" />
            <span>Platform Analytics & AI Intelligence</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visual graphs for user growth, resume uploads, ATS distributions, extracted skills, and AI module usage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <FiCalendar className="text-slate-400" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700/60"
            >
              <FiDownload className="text-emerald-400" /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700/60"
            >
              <FiDownload className="text-blue-400" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700/60"
            >
              <FiDownload className="text-rose-400" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Registrations */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4">Daily User Registrations</h3>
          <div className="h-64">
            <Line data={dailyRegChartData} options={chartOptions} />
          </div>
        </div>

        {/* Daily Resume Uploads */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4">Daily Resume Uploads</h3>
          <div className="h-64">
            <Bar data={dailyUploadsChartData} options={chartOptions} />
          </div>
        </div>

        {/* ATS Score Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4">ATS Score Range Distribution</h3>
          <div className="h-64 flex justify-center">
            <Doughnut
              data={atsDistributionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
              }}
            />
          </div>
        </div>

        {/* Job Match Score Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4">Job Match Score Distribution</h3>
          <div className="h-64 flex justify-center">
            <Doughnut
              data={jobMatchDistributionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
              }}
            />
          </div>
        </div>

        {/* Most Common Extracted Skills */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4">Top 10 Extracted Skills</h3>
          <div className="h-64">
            <Bar data={topSkillsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Most Common Missing Skills */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-4">Top 10 Most Common Missing Skills</h3>
          <div className="h-64">
            <Bar data={topMissingSkillsChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
