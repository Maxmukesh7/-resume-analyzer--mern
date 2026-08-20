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
        <div className="h-20 bg-[#121519] rounded-2xl border border-[#292D33]"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-[#121519] rounded-3xl border border-[#292D33]"></div>
          <div className="h-64 bg-[#121519] rounded-3xl border border-[#292D33]"></div>
          <div className="h-64 bg-[#121519] rounded-3xl border border-[#292D33]"></div>
          <div className="h-64 bg-[#121519] rounded-3xl border border-[#292D33]"></div>
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
        borderColor: '#F5B83D',
        backgroundColor: 'rgba(245, 184, 61, 0.15)',
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
        backgroundColor: '#FFD166',
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
        backgroundColor: ['#F87171', '#B7791F', '#F5B83D', '#4ADE80'],
        borderWidth: 2,
        borderColor: '#121519'
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
        backgroundColor: '#F5B83D',
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
        backgroundColor: '#F87171',
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
        backgroundColor: ['#F87171', '#B7791F', '#F5B83D', '#4ADE80'],
        borderWidth: 2,
        borderColor: '#121519'
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
        labels: { color: '#A7ADB7', font: { size: 11 } }
      }
    },
    scales: {
      x: { ticks: { color: '#6F7682', font: { size: 10 } }, grid: { color: 'rgba(41, 45, 51, 0.6)' } },
      y: { ticks: { color: '#6F7682', font: { size: 10 } }, grid: { color: 'rgba(41, 45, 51, 0.6)' } }
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121519] border border-[#292D33] p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight flex items-center gap-3">
            <FiBarChart2 className="w-7 h-7 text-[#F5B83D]" />
            <span>Platform Analytics & AI Intelligence</span>
          </h1>
          <p className="text-sm text-[#A7ADB7] mt-1">
            Visual graphs for user growth, resume uploads, ATS distributions, extracted skills, and AI module usage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0D0F12] border border-[#292D33] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5]">
            <FiCalendar className="text-[#A7ADB7]" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value={7} className="bg-[#0D0F12]">Last 7 Days</option>
              <option value={14} className="bg-[#0D0F12]">Last 14 Days</option>
              <option value={30} className="bg-[#0D0F12]">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] text-xs font-semibold flex items-center gap-1 border border-[#292D33] cursor-pointer"
            >
              <FiDownload className="text-[#F5B83D]" /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] text-xs font-semibold flex items-center gap-1 border border-[#292D33] cursor-pointer"
            >
              <FiDownload className="text-[#FFD166]" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] text-xs font-semibold flex items-center gap-1 border border-[#292D33] cursor-pointer"
            >
              <FiDownload className="text-[#B7791F]" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Registrations */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-4">Daily User Registrations</h3>
          <div className="h-64">
            <Line data={dailyRegChartData} options={chartOptions} />
          </div>
        </div>

        {/* Daily Resume Uploads */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-4">Daily Resume Uploads</h3>
          <div className="h-64">
            <Bar data={dailyUploadsChartData} options={chartOptions} />
          </div>
        </div>

        {/* ATS Score Distribution */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-4">ATS Score Range Distribution</h3>
          <div className="h-64 flex justify-center">
            <Doughnut
              data={atsDistributionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#A7ADB7' } } }
              }}
            />
          </div>
        </div>

        {/* Job Match Score Distribution */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-4">Job Match Score Distribution</h3>
          <div className="h-64 flex justify-center">
            <Doughnut
              data={jobMatchDistributionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#A7ADB7' } } }
              }}
            />
          </div>
        </div>

        {/* Most Common Extracted Skills */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-4">Top 10 Extracted Skills</h3>
          <div className="h-64">
            <Bar data={topSkillsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Most Common Missing Skills */}
        <div className="bg-[#121519] border border-[#292D33] rounded-3xl p-6 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-[#F5F5F5] mb-4">Top 10 Most Common Missing Skills</h3>
          <div className="h-64">
            <Bar data={topMissingSkillsChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
