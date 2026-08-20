import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { useToast } from '../../components/Common/Toast';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiEye,
  FiShield,
  FiDownload,
  FiX,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

export default function AdminUsers() {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const fetchUsers = async (searchTerm = search) => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        page,
        limit: 10,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });
      if (res.success) {
        setUsers(res.data.users || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalUsers(res.data.pagination?.total || 0);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search);
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await adminService.updateUserRole(userId, newRole);
      if (res.success) {
        showToast(`User role updated to ${newRole}`, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const res = await adminService.updateUserStatus(userId, newStatus);
      if (res.success) {
        showToast(`User account status updated to ${newStatus ? 'Active' : 'Deactivated'}`, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This will remove all their uploaded resumes and scans.`)) {
      return;
    }
    try {
      const res = await adminService.deleteUser(userId);
      if (res.success) {
        showToast('User and associated data deleted permanently', 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setModalLoading(true);
      const res = await adminService.getUserById(userId);
      if (res.success) {
        setSelectedUserDetail(res.data);
      }
    } catch (err) {
      showToast('Failed to load user details', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const exportData = users.map((u) => ({
      ID: u._id,
      Name: u.fullName,
      Email: u.email,
      Role: u.role,
      Status: u.isActive === false ? 'Deactivated' : 'Active',
      JoinedDate: new Date(u.createdAt).toLocaleDateString()
    }));
    exportToCSV(exportData, 'users-export.csv');
  };

  const handleExportExcel = () => {
    const exportData = users.map((u) => ({
      ID: u._id,
      Name: u.fullName,
      Email: u.email,
      Role: u.role,
      Status: u.isActive === false ? 'Deactivated' : 'Active',
      JoinedDate: new Date(u.createdAt).toLocaleDateString()
    }));
    exportToExcel(exportData, 'users-export.xlsx');
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const rows = users.map((u) => [
      u.fullName,
      u.email,
      u.role.toUpperCase(),
      u.isActive === false ? 'Deactivated' : 'Active',
      new Date(u.createdAt).toLocaleDateString()
    ]);
    exportToPDF('User Accounts Report', headers, rows, 'users-report.pdf');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121519] border border-[#292D33] p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight flex items-center gap-3">
            <FiUsers className="w-7 h-7 text-[#F5B83D]" />
            <span>User Management</span>
          </h1>
          <p className="text-sm text-[#A7ADB7] mt-1">
            Manage user permissions, activate/deactivate accounts, and view user audit trails. ({totalUsers} total users)
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#121519] border border-[#292D33] rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-[#6F7682] w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#0D0F12] border border-[#292D33] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <FiFilter className="text-[#A7ADB7] w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#0D0F12] border border-[#292D33] text-[#F5F5F5] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#F5B83D]"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#0D0F12] border border-[#292D33] text-[#F5F5F5] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#F5B83D]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactivated">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#121519] border border-[#292D33] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D0F12] text-[#A7ADB7] uppercase tracking-wider font-semibold border-b border-[#292D33]">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292D33] text-[#A7ADB7]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#6F7682]">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#6F7682]">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-[#171A1F]/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#F5F5F5] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] font-bold flex items-center justify-center">
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="px-6 py-4 text-[#A7ADB7] font-mono">{u.email}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRoleToggle(u._id, u.role)}
                        title="Click to toggle User/Admin role"
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          u.role === 'admin'
                            ? 'bg-[#F5B83D]/15 text-[#FFD166] border-[#F5B83D]/30 hover:bg-[#F5B83D]/25'
                            : 'bg-[#0D0F12] text-[#A7ADB7] border-[#292D33] hover:bg-[#171A1F]'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(u._id, u.isActive !== false)}
                        title="Click to activate/deactivate account"
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          u.isActive !== false
                            ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30 hover:bg-[#4ADE80]/25'
                            : 'bg-rose-500/10 text-[#F87171] border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {u.isActive !== false ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[#A7ADB7]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewUser(u._id)}
                        title="View User Details"
                        className="p-2 text-[#FFD166] hover:bg-[#171A1F] rounded-lg transition-colors cursor-pointer"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id, u.email)}
                        title="Delete User"
                        className="p-2 text-[#F87171] hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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

      {/* User Details Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-[#08090B]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121519] border border-[#292D33] rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#292D33] pb-4">
              <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <FiShield className="w-5 h-5 text-[#F5B83D]" />
                <span>User Audit Details</span>
              </h2>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-[#A7ADB7] hover:text-[#F5F5F5] rounded-lg bg-[#0D0F12] border border-[#292D33] cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0D0F12] border border-[#292D33]">
                <p className="text-xs text-[#A7ADB7] font-semibold uppercase">Full Name</p>
                <p className="text-base font-bold text-[#F5F5F5] mt-1">{selectedUserDetail.user?.fullName}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0D0F12] border border-[#292D33]">
                <p className="text-xs text-[#A7ADB7] font-semibold uppercase">Email Address</p>
                <p className="text-base font-bold text-[#FFD166] mt-1 font-mono">{selectedUserDetail.user?.email}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#0D0F12] text-center border border-[#292D33]">
                <p className="text-xl font-bold text-[#F5F5F5]">{selectedUserDetail.userMetrics?.totalResumes || 0}</p>
                <p className="text-[10px] text-[#A7ADB7] uppercase">Resumes</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0F12] text-center border border-[#292D33]">
                <p className="text-xl font-bold text-[#FFD166]">{selectedUserDetail.userMetrics?.totalAtsScans || 0}</p>
                <p className="text-[10px] text-[#A7ADB7] uppercase">ATS Scans</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0F12] text-center border border-[#292D33]">
                <p className="text-xl font-bold text-[#F5B83D]">{selectedUserDetail.userMetrics?.totalAiAnalyses || 0}</p>
                <p className="text-[10px] text-[#A7ADB7] uppercase">AI Scans</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0F12] text-center border border-[#292D33]">
                <p className="text-xl font-bold text-[#FFD166]">{selectedUserDetail.userMetrics?.totalJobMatches || 0}</p>
                <p className="text-[10px] text-[#A7ADB7] uppercase">Job Matches</p>
              </div>
            </div>

            {/* Uploaded Resumes List */}
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F5] mb-2">Uploaded Resumes</h3>
              {selectedUserDetail.resumes?.length === 0 ? (
                <p className="text-xs text-[#6F7682]">No uploaded resumes on record.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedUserDetail.resumes?.map((r) => (
                    <div key={r._id} className="p-3 rounded-xl bg-[#0D0F12] border border-[#292D33] flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#F5F5F5] truncate">{r.originalName}</span>
                      <span className="text-[#A7ADB7] text-[11px]">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
