import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { getFileUrl } from '../../services/api';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { useToast } from '../../components/Common/Toast';
import {
  FiFileText,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEye,
  FiDownload,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

export default function AdminResumes() {
  const { showToast } = useToast();

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minAtsFilter, setMinAtsFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResumes, setTotalResumes] = useState(0);

  // Detail Modal State
  const [selectedResumeDetail, setSelectedResumeDetail] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, [page, minAtsFilter]);

  const fetchResumes = async (searchTerm = search) => {
    try {
      setLoading(true);
      const res = await adminService.getResumes({
        page,
        limit: 10,
        search: searchTerm,
        minAts: minAtsFilter || undefined
      });
      if (res.success) {
        setResumes(res.data.resumes || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalResumes(res.data.pagination?.total || 0);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch resumes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResumes(search);
  };

  const handleDeleteResume = async (resumeId, resumeName) => {
    if (!window.confirm(`Are you sure you want to delete resume "${resumeName}"? This operation cannot be undone.`)) {
      return;
    }
    try {
      const res = await adminService.deleteResume(resumeId);
      if (res.success) {
        showToast('Resume and linked analyses deleted', 'success');
        fetchResumes();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete resume', 'error');
    }
  };

  const handleViewResume = async (resumeId) => {
    try {
      const res = await adminService.getResumeById(resumeId);
      if (res.success) {
        setSelectedResumeDetail(res.data);
      }
    } catch (err) {
      showToast('Failed to load resume details', 'error');
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const exportData = resumes.map((r) => ({
      ID: r._id,
      FileName: r.originalName,
      UserEmail: r.user?.email || 'N/A',
      ATS_Score: r.atsReport ? r.atsReport.overallScore : 'N/A',
      UploadDate: new Date(r.createdAt).toLocaleDateString()
    }));
    exportToCSV(exportData, 'resumes-export.csv');
  };

  const handleExportExcel = () => {
    const exportData = resumes.map((r) => ({
      ID: r._id,
      FileName: r.originalName,
      UserEmail: r.user?.email || 'N/A',
      ATS_Score: r.atsReport ? r.atsReport.overallScore : 'N/A',
      UploadDate: new Date(r.createdAt).toLocaleDateString()
    }));
    exportToExcel(exportData, 'resumes-export.xlsx');
  };

  const handleExportPDF = () => {
    const headers = ['File Name', 'Uploaded By', 'ATS Score', 'Upload Date'];
    const rows = resumes.map((r) => [
      r.originalName,
      r.user?.email || 'N/A',
      r.atsReport ? `${r.atsReport.overallScore}/100` : 'N/A',
      new Date(r.createdAt).toLocaleDateString()
    ]);
    exportToPDF('Uploaded Resumes Repository', headers, rows, 'resumes-report.pdf');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FiFileText className="w-7 h-7 text-emerald-400" />
            <span>Resume Repository</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, inspect, filter, download, or delete uploaded resumes and AI reports across all users. ({totalResumes} total resumes)
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resume title or skills..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select
            value={minAtsFilter}
            onChange={(e) => {
              setMinAtsFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="">All ATS Scores</option>
            <option value="80">Top Scores (80+)</option>
            <option value="60">Good Scores (60+)</option>
            <option value="40">Fair Scores (40+)</option>
          </select>
        </div>
      </div>

      {/* Resumes Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Resume File</th>
                <th className="px-6 py-4">Uploaded By</th>
                <th className="px-6 py-4">ATS Score</th>
                <th className="px-6 py-4">Parsed Status</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    Loading resumes repository...
                  </td>
                </tr>
              ) : resumes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No resumes matching criteria found.
                  </td>
                </tr>
              ) : (
                resumes.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <FiFileText className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-xs">{r.originalName}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {r.user?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {r.atsReport ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            r.atsReport.overallScore >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : r.atsReport.overallScore >= 60
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {r.atsReport.overallScore} / 100
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not Scanned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                        {r.parseStatus || 'Parsed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewResume(r._id)}
                        title="View Resume Parsed & ATS Details"
                        className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>

                      {r.uploadPath && (
                        <a
                          href={getFileUrl(r.uploadPath)}
                          target="_blank"
                          rel="noreferrer"
                          download
                          title="Download Resume File"
                          className="inline-block p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          <FiDownload className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteResume(r._id, r.originalName)}
                        title="Delete Resume"
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* Resume Inspection Modal */}
      {selectedResumeDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-emerald-400" />
                <span>Resume Audit Details</span>
              </h2>
              <button
                onClick={() => setSelectedResumeDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Resume Info */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white">{selectedResumeDetail.resume?.originalName}</p>
                <p className="text-xs text-slate-400 mt-0.5">Uploaded by: {selectedResumeDetail.resume?.user?.email}</p>
              </div>
              {selectedResumeDetail.atsReport && (
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {selectedResumeDetail.atsReport.overallScore}/100
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase">ATS Score</p>
                </div>
              )}
            </div>

            {/* Extracted Candidate Profile */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Parsed Resume Profile</h3>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <p><span className="text-slate-500 font-semibold">Candidate Name:</span> {selectedResumeDetail.resume?.parsedData?.fullName || 'N/A'}</p>
                <p><span className="text-slate-500 font-semibold">Email:</span> {selectedResumeDetail.resume?.parsedData?.email || 'N/A'}</p>
                <p><span className="text-slate-500 font-semibold">Phone:</span> {selectedResumeDetail.resume?.parsedData?.phone || 'N/A'}</p>
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Detected Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResumeDetail.resume?.parsedData?.skills?.length ? (
                      selectedResumeDetail.resume.parsedData.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px]">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None detected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ATS Analysis Overview */}
            {selectedResumeDetail.atsReport && (
              <div>
                <h3 className="text-sm font-bold text-white mb-2">ATS Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <p className="text-lg font-bold text-white">{selectedResumeDetail.atsReport.skillsScore}%</p>
                    <p className="text-[10px] text-slate-400">Skills Score</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <p className="text-lg font-bold text-white">{selectedResumeDetail.atsReport.experienceScore}%</p>
                    <p className="text-[10px] text-slate-400">Experience</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <p className="text-lg font-bold text-white">{selectedResumeDetail.atsReport.structureScore}%</p>
                    <p className="text-[10px] text-slate-400">Structure</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
