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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121519] border border-[#292D33] p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight flex items-center gap-3">
            <FiFileText className="w-7 h-7 text-[#F5B83D]" />
            <span>Resume Repository</span>
          </h1>
          <p className="text-sm text-[#A7ADB7] mt-1">
            Browse, inspect, filter, download, or delete uploaded resumes and AI reports across all users. ({totalResumes} total resumes)
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
            placeholder="Search resume title or skills..."
            className="w-full bg-[#0D0F12] border border-[#292D33] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D]"
          />
        </form>

        <div className="flex items-center gap-3">
          <FiFilter className="text-[#A7ADB7] w-4 h-4" />
          <select
            value={minAtsFilter}
            onChange={(e) => {
              setMinAtsFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0D0F12] border border-[#292D33] text-[#F5F5F5] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#F5B83D]"
          >
            <option value="">All ATS Scores</option>
            <option value="80">Top Scores (80+)</option>
            <option value="60">Good Scores (60+)</option>
            <option value="40">Fair Scores (40+)</option>
          </select>
        </div>
      </div>

      {/* Resumes Table */}
      <div className="bg-[#121519] border border-[#292D33] rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D0F12] text-[#A7ADB7] uppercase tracking-wider font-semibold border-b border-[#292D33]">
              <tr>
                <th className="px-6 py-4">Resume File</th>
                <th className="px-6 py-4">Uploaded By</th>
                <th className="px-6 py-4">ATS Score</th>
                <th className="px-6 py-4">Parsed Status</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292D33] text-[#A7ADB7]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#6F7682]">
                    Loading resumes repository...
                  </td>
                </tr>
              ) : resumes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#6F7682]">
                    No resumes matching criteria found.
                  </td>
                </tr>
              ) : (
                resumes.map((r) => (
                  <tr key={r._id} className="hover:bg-[#171A1F]/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#F5F5F5] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] flex items-center justify-center font-bold">
                        <FiFileText className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-xs">{r.originalName}</span>
                    </td>
                    <td className="px-6 py-4 text-[#A7ADB7] font-mono">
                      {r.user?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {r.atsReport ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            r.atsReport.overallScore >= 80
                              ? 'bg-[#F5B83D]/20 text-[#FFD166] border-[#F5B83D]/40'
                              : r.atsReport.overallScore >= 60
                              ? 'bg-[#F5B83D]/15 text-[#F5B83D] border-[#F5B83D]/25'
                              : 'bg-[#171A1F] text-[#A7ADB7] border-[#292D33]'
                          }`}
                        >
                          {r.atsReport.overallScore} / 100
                        </span>
                      ) : (
                        <span className="text-[#6F7682] italic">Not Scanned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#08090B] border border-[#292D33] text-[#A7ADB7]">
                        {r.parseStatus || 'Parsed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#A7ADB7]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewResume(r._id)}
                        title="View Resume Parsed & ATS Details"
                        className="p-2 text-[#FFD166] hover:bg-[#171A1F] rounded-lg transition-colors cursor-pointer"
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
                          className="inline-block p-2 text-[#F5B83D] hover:bg-[#171A1F] rounded-lg transition-colors"
                        >
                          <FiDownload className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteResume(r._id, r.originalName)}
                        title="Delete Resume"
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

      {/* Resume Inspection Modal */}
      {selectedResumeDetail && (
        <div className="fixed inset-0 bg-[#08090B]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121519] border border-[#292D33] rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#292D33] pb-4">
              <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-[#F5B83D]" />
                <span>Resume Audit Details</span>
              </h2>
              <button
                onClick={() => setSelectedResumeDetail(null)}
                className="p-2 text-[#A7ADB7] hover:text-[#F5F5F5] rounded-lg bg-[#0D0F12] border border-[#292D33] cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Resume Info */}
            <div className="p-4 rounded-2xl bg-[#0D0F12] border border-[#292D33] flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-[#F5F5F5]">{selectedResumeDetail.resume?.originalName}</p>
                <p className="text-xs text-[#A7ADB7] mt-0.5">Uploaded by: {selectedResumeDetail.resume?.user?.email}</p>
              </div>
              {selectedResumeDetail.atsReport && (
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[#FFD166]">
                    {selectedResumeDetail.atsReport.overallScore}/100
                  </span>
                  <p className="text-[10px] text-[#A7ADB7] uppercase">ATS Score</p>
                </div>
              )}
            </div>

            {/* Extracted Candidate Profile */}
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F5] mb-2">Parsed Resume Profile</h3>
              <div className="p-4 rounded-2xl bg-[#0D0F12] border border-[#292D33] space-y-3 text-xs">
                <p><span className="text-[#A7ADB7] font-semibold">Candidate Name:</span> <span className="text-[#F5F5F5]">{selectedResumeDetail.resume?.parsedData?.fullName || 'N/A'}</span></p>
                <p><span className="text-[#A7ADB7] font-semibold">Email:</span> <span className="text-[#F5F5F5]">{selectedResumeDetail.resume?.parsedData?.email || 'N/A'}</span></p>
                <p><span className="text-[#A7ADB7] font-semibold">Phone:</span> <span className="text-[#F5F5F5]">{selectedResumeDetail.resume?.parsedData?.phone || 'N/A'}</span></p>
                <div>
                  <span className="text-[#A7ADB7] font-semibold block mb-1">Detected Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResumeDetail.resume?.parsedData?.skills?.length ? (
                      selectedResumeDetail.resume.parsedData.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-[#171A1F] text-[#FFD166] border border-[#F5B83D]/30 text-[11px]">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#6F7682]">None detected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ATS Analysis Overview */}
            {selectedResumeDetail.atsReport && (
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F5] mb-2">ATS Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#0D0F12] border border-[#292D33] text-center">
                    <p className="text-lg font-bold text-[#F5F5F5]">{selectedResumeDetail.atsReport.skillsScore}%</p>
                    <p className="text-[10px] text-[#A7ADB7]">Skills Score</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D0F12] border border-[#292D33] text-center">
                    <p className="text-lg font-bold text-[#F5F5F5]">{selectedResumeDetail.atsReport.experienceScore}%</p>
                    <p className="text-[10px] text-[#A7ADB7]">Experience</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D0F12] border border-[#292D33] text-center">
                    <p className="text-lg font-bold text-[#F5F5F5]">{selectedResumeDetail.atsReport.structureScore}%</p>
                    <p className="text-[10px] text-[#A7ADB7]">Structure</p>
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
