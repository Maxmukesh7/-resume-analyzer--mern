import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaFileAlt, FaChartLine, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import { useToast } from '../../components/Common/Toast';
import { mockHistory } from '../../utils/mockData';

export default function ResumeHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [resumes, setResumes] = useState(mockHistory);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const itemsPerPage = 5;

  // Filter and search logic
  const filteredResumes = useMemo(() => {
    return resumes.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [resumes, search, statusFilter]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredResumes.length / itemsPerPage) || 1;
  const paginatedResumes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResumes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResumes, currentPage]);

  const handleViewReport = (id) => {
    navigate(`/dashboard/report?id=${id}`);
  };

  const handleDelete = (id, name) => {
    setResumes((prev) => prev.filter((item) => item.id !== id));
    showToast(`Removed '${name}' from history.`, 'info');
  };

  const getScoreVariant = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'info';
    return 'warning';
  };

  const getStatusVariant = (status) => {
    if (status === 'Optimized') return 'success';
    if (status === 'Good') return 'info';
    return 'warning';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">Resume History</h1>
        <p className="text-slate-450 text-xs mt-1.5 font-semibold">
          Review, search, and manage your previously analyzed resumes and their diagnostics.
        </p>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
          <input
            type="text"
            placeholder="Search resumes by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all text-xs"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <FaFilter size={10} />
            <span>Filter:</span>
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-350 focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            <option value="All">All Scores</option>
            <option value="Optimized">Optimized (&ge; 85%)</option>
            <option value="Good">Good (70% - 84%)</option>
            <option value="Needs Action">Needs Action (&lt; 70%)</option>
          </select>
        </div>
      </div>

      {/* History Table Card */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/70 border-b border-slate-800/80 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">ATS Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/30">
              {paginatedResumes.length > 0 ? (
                paginatedResumes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/10 transition-colors group">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 border border-blue-500/15 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                          <FaFileAlt size={14} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block truncate max-w-xs md:max-w-md">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{item.fileSize}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-xs text-slate-400 font-medium">
                      {item.uploadDate}
                    </td>
                    <td className="px-6 py-4.5">
                      <Badge variant={getScoreVariant(item.score)}>
                        {item.score}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4.5">
                      <Badge variant={getStatusVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewReport(item.id)}
                          className="p-2 text-xs font-semibold rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/10 border border-blue-500/20 transition-all flex items-center gap-1.5"
                          title="View Diagnosis"
                        >
                          <FaChartLine size={12} />
                          <span className="hidden sm:inline">Report</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 text-xs font-semibold rounded-lg text-rose-455 hover:text-white hover:bg-rose-600/10 border border-rose-500/20 transition-all"
                          title="Delete Resume"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-xs">
                    No matching resumes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <span className="text-slate-350 font-bold">{currentPage}</span> of{' '}
              <span className="text-slate-350 font-bold">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <FaChevronLeft size={10} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border
                    ${currentPage === i + 1
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-white hover:bg-slate-800/40'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
