import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { useToast } from '../../components/Common/Toast';
import {
  FiActivity,
  FiSearch,
  FiFilter,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiGlobe,
  FiMonitor,
  FiUser
} from 'react-icons/fi';

export default function AdminActivity() {
  const { showToast } = useToast();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchActivity();
  }, [page, actionFilter]);

  const fetchActivity = async (searchTerm = search) => {
    try {
      setLoading(true);
      const res = await adminService.getActivity({
        page,
        limit: 15,
        search: searchTerm,
        action: actionFilter
      });
      if (res.success) {
        setActivities(res.data.activities || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalLogs(res.data.pagination?.total || 0);
      }
    } catch (err) {
      showToast('Failed to fetch activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchActivity(search);
  };

  const handleExportCSV = () => {
    const exportData = activities.map((a) => ({
      LogID: a._id,
      Action: a.action,
      User: a.user?.email || 'Guest System',
      Description: a.description || '',
      IPAddress: a.ipAddress || '',
      Timestamp: new Date(a.createdAt).toLocaleString()
    }));
    exportToCSV(exportData, 'activity-logs.csv');
  };

  const handleExportExcel = () => {
    const exportData = activities.map((a) => ({
      LogID: a._id,
      Action: a.action,
      User: a.user?.email || 'Guest System',
      Description: a.description || '',
      IPAddress: a.ipAddress || '',
      Timestamp: new Date(a.createdAt).toLocaleString()
    }));
    exportToExcel(exportData, 'activity-logs.xlsx');
  };

  const handleExportPDF = () => {
    const headers = ['Action', 'User', 'IP Address', 'Timestamp'];
    const rows = activities.map((a) => [
      a.action,
      a.user?.email || 'Guest',
      a.ipAddress || 'N/A',
      new Date(a.createdAt).toLocaleString()
    ]);
    exportToPDF('System Activity Logs', headers, rows, 'activity-logs.pdf');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121519] border border-[#292D33] p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight flex items-center gap-3">
            <FiActivity className="w-7 h-7 text-[#F5B83D]" />
            <span>Activity Log Feed</span>
          </h1>
          <p className="text-sm text-[#A7ADB7] mt-1">
            Real-time audit trail of user registrations, resume uploads, ATS scans, AI operations, and admin actions. ({totalLogs} total events)
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] text-xs font-semibold flex items-center gap-1.5 border border-[#292D33] transition-all cursor-pointer"
          >
            <FiDownload className="w-4 h-4 text-[#F5B83D]" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] text-xs font-semibold flex items-center gap-1.5 border border-[#292D33] transition-all cursor-pointer"
          >
            <FiDownload className="w-4 h-4 text-[#FFD166]" /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] text-xs font-semibold flex items-center gap-1.5 border border-[#292D33] transition-all cursor-pointer"
          >
            <FiDownload className="w-4 h-4 text-[#B7791F]" /> PDF
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 bg-[#121519] border border-[#292D33] rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-[#6F7682] w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or IP address..."
            className="w-full bg-[#0D0F12] border border-[#292D33] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D]"
          />
        </form>

        <div className="flex items-center gap-3">
          <FiFilter className="text-[#A7ADB7] w-4 h-4" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0D0F12] border border-[#292D33] text-[#F5F5F5] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#F5B83D]"
          >
            <option value="all">All Action Events</option>
            <option value="Registered">User Registration</option>
            <option value="Uploaded">Resume Uploaded</option>
            <option value="Admin">Admin Actions</option>
            <option value="Logged">User Login</option>
          </select>
        </div>
      </div>

      {/* Activity Feed Table */}
      <div className="bg-[#121519] border border-[#292D33] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D0F12] text-[#A7ADB7] uppercase tracking-wider font-semibold border-b border-[#292D33]">
              <tr>
                <th className="px-6 py-4">Event Action</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292D33] text-[#A7ADB7]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[#6F7682]">
                    Loading activity feed...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[#6F7682]">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                activities.map((a) => (
                  <tr key={a._id} className="hover:bg-[#171A1F]/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#F5F5F5] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] flex items-center justify-center">
                        <FiActivity className="w-4 h-4" />
                      </div>
                      <span>{a.action}</span>
                    </td>
                    <td className="px-6 py-4 text-[#A7ADB7] flex items-center gap-1.5">
                      <FiUser className="text-[#6F7682]" />
                      <span>{a.user?.fullName || a.user?.email || 'Guest System'}</span>
                    </td>
                    <td className="px-6 py-4 text-[#A7ADB7] max-w-xs truncate">
                      {a.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-[#A7ADB7] font-mono flex items-center gap-1.5">
                      <FiGlobe className="text-[#6F7682]" />
                      <span>{a.ipAddress || '127.0.0.1'}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-[#A7ADB7] font-mono">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#292D33] flex items-center justify-between text-xs text-[#A7ADB7]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg bg-[#0D0F12] hover:bg-[#171A1F] disabled:opacity-40 transition-colors border border-[#292D33] cursor-pointer"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-[#0D0F12] hover:bg-[#171A1F] disabled:opacity-40 transition-colors border border-[#292D33] cursor-pointer"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
