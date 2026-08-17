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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FiActivity className="w-7 h-7 text-purple-400" />
            <span>Activity Log Feed</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit trail of user registrations, resume uploads, ATS scans, AI operations, and admin actions. ({totalLogs} total events)
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-all"
          >
            <FiDownload className="w-4 h-4 text-emerald-400" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-all"
          >
            <FiDownload className="w-4 h-4 text-blue-400" /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-all"
          >
            <FiDownload className="w-4 h-4 text-rose-400" /> PDF
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or IP address..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
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
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Event Action</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    Loading activity feed...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                activities.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                        <FiActivity className="w-4 h-4" />
                      </div>
                      <span>{a.action}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5">
                      <FiUser className="text-slate-500" />
                      <span>{a.user?.fullName || a.user?.email || 'Guest System'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {a.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono flex items-center gap-1.5">
                      <FiGlobe className="text-slate-500" />
                      <span>{a.ipAddress || '127.0.0.1'}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 font-mono">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
