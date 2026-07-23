import { useState, useMemo, useEffect } from 'react';
import { FaSearch, FaFileAlt, FaInfoCircle, FaTrash, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { getResumes, deleteResume } from '../../services/resumeService';

export default function ResumeHistory() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { showToast } = useToast();
  const itemsPerPage = 5;

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await getResumes();
      // Handle both res.data and array responses safely
      const data = res.data || res;
      setResumes(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load resume history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Filter and search logic
  const filteredResumes = useMemo(() => {
    return resumes.filter((item) => {
      const fileName = item.originalName || item.fileName || '';
      return fileName.toLowerCase().includes(search.toLowerCase());
    });
  }, [resumes, search]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredResumes.length / itemsPerPage) || 1;
  const paginatedResumes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResumes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResumes, currentPage]);

  const handleViewDetails = (resume) => {
    setSelectedResume(resume);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete '${fileName}'?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteResume(id);
      setResumes((prev) => prev.filter((item) => (item._id || item.id) !== id));
      showToast(`Resume '${fileName}' deleted successfully.`, 'success');
      if (selectedResume && (selectedResume._id === id || selectedResume.id === id)) {
        setIsModalOpen(false);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete resume.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getFriendlySize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeLabel = (fileType, originalName) => {
    if (fileType?.includes('pdf') || originalName?.toLowerCase().endsWith('.pdf')) {
      return 'PDF';
    }
    if (fileType?.includes('word') || fileType?.includes('document') || originalName?.toLowerCase().endsWith('.docx')) {
      return 'DOCX';
    }
    return 'FILE';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">Resume History</h1>
        <p className="text-slate-450 text-xs mt-1.5 font-semibold">
          Review, view details, and manage your uploaded resumes.
        </p>
      </div>

      {/* Control Bar */}
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
      </div>

      {/* History Table Card */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/70 border-b border-slate-800/80 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">File Size</th>
                <th className="px-6 py-4">File Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin text-blue-400" size={16} />
                      <span>Loading resume history...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedResumes.length > 0 ? (
                paginatedResumes.map((item) => {
                  const itemId = item._id || item.id;
                  const name = item.originalName || item.fileName || 'Untitled Resume';
                  const fileTypeLabel = getFileTypeLabel(item.fileType, name);

                  return (
                    <tr key={itemId} className="hover:bg-slate-800/10 transition-colors group">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600/10 border border-blue-500/15 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                            <FaFileAlt size={14} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block truncate max-w-xs md:max-w-md" title={name}>
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">{item.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-xs text-slate-400 font-medium">
                        {formatDate(item.uploadDate)}
                      </td>
                      <td className="px-6 py-4.5 text-xs text-slate-400 font-medium">
                        {getFriendlySize(item.fileSize)}
                      </td>
                      <td className="px-6 py-4.5">
                        <Badge variant={fileTypeLabel === 'PDF' ? 'danger' : 'info'}>
                          {fileTypeLabel}
                        </Badge>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="p-2 text-xs font-semibold rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/10 border border-blue-500/20 transition-all flex items-center gap-1.5"
                            title="View Details"
                          >
                            <FaInfoCircle size={12} />
                            <span className="hidden sm:inline">Details</span>
                          </button>
                          <button
                            onClick={() => handleDelete(itemId, name)}
                            disabled={deletingId === itemId}
                            className="p-2 text-xs font-semibold rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/10 border border-rose-500/20 transition-all disabled:opacity-50"
                            title="Delete Resume"
                          >
                            {deletingId === itemId ? (
                              <FaSpinner className="animate-spin" size={12} />
                            ) : (
                              <FaTrash size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-xs">
                    No uploaded resumes found.
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

      {/* Resume Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resume Details"
        size="md"
      >
        {selectedResume && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Original File Name:</span>
                <span className="text-slate-200 font-bold truncate max-w-[200px]" title={selectedResume.originalName}>
                  {selectedResume.originalName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Stored File Name:</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[200px]" title={selectedResume.fileName}>
                  {selectedResume.fileName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">File Type:</span>
                <span className="text-slate-200 font-semibold">{selectedResume.fileType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">File Size:</span>
                <span className="text-slate-200 font-semibold">{getFriendlySize(selectedResume.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Upload Date:</span>
                <span className="text-slate-200 font-semibold">{formatDate(selectedResume.uploadDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Upload Status:</span>
                <Badge variant="success">{selectedResume.status || 'Uploaded'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Database Record ID:</span>
                <span className="text-slate-400 font-mono text-[10px]">{selectedResume._id || selectedResume.id}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                icon={<FaTrash size={12} />}
                onClick={() => handleDelete(selectedResume._id || selectedResume.id, selectedResume.originalName)}
              >
                Delete Resume
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
