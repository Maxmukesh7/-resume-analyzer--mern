import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaFileAlt,
  FaInfoCircle,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckSquare,
  FaSquare,
  FaLayerGroup
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import {
  getResumes,
  deleteResume,
  deleteAllResumes,
  deleteBulkResumes
} from '../../services/resumeService';

export default function ResumeHistory() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Bulk & Delete All States
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const itemsPerPage = 5;

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await getResumes();
      const data = res.data || res;
      setResumes(Array.isArray(data) ? data : []);
      setSelectedIds([]);
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

  // Bulk Selection Helpers
  const isAllPaginatedSelected =
    paginatedResumes.length > 0 &&
    paginatedResumes.every((item) => selectedIds.includes(item._id || item.id));

  const toggleSelectAllPaginated = () => {
    const paginatedIds = paginatedResumes.map((r) => r._id || r.id);
    if (isAllPaginatedSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  const toggleSelectResume = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleViewDetails = (resume) => {
    const itemId = resume._id || resume.id;
    if (itemId) {
      navigate(`/dashboard/resume/${itemId}`);
    }
  };

  // Single Delete
  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete '${fileName}'?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteResume(id);
      setResumes((prev) => prev.filter((item) => (item._id || item.id) !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
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

  // Delete All Resumes
  const handleConfirmDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      const res = await deleteAllResumes();
      const count = res.data?.count || resumes.length;
      setResumes([]);
      setSelectedIds([]);
      setIsDeleteAllModalOpen(false);
      if (selectedResume) {
        setIsModalOpen(false);
      }
      showToast(`All ${count} resume(s) and associated records were deleted successfully.`, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete all resumes.', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Delete Selected Resumes
  const handleConfirmDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsDeletingSelected(true);
      const res = await deleteBulkResumes(selectedIds);
      const count = res.data?.count || selectedIds.length;
      setResumes((prev) => prev.filter((r) => !selectedIds.includes(r._id || r.id)));
      setSelectedIds([]);
      setIsDeleteSelectedModalOpen(false);
      showToast(`Deleted ${count} selected resume(s) successfully.`, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete selected resumes.', 'error');
    } finally {
      setIsDeletingSelected(false);
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
    const lowerName = originalName?.toLowerCase() || '';
    if (fileType?.includes('pdf') || lowerName.endsWith('.pdf')) {
      return 'PDF';
    }
    if (fileType?.includes('msword') || lowerName.endsWith('.doc')) {
      return 'DOC';
    }
    if (fileType?.includes('word') || fileType?.includes('document') || lowerName.endsWith('.docx')) {
      return 'DOCX';
    }
    return 'FILE';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-wide">Resume History</h1>
          <p className="text-[#A7ADB7] text-xs mt-1.5 font-semibold">
            Review, view details, and manage your uploaded resumes.
          </p>
        </div>

        {/* Global Delete All Action Button */}
        {resumes.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            icon={<FaTrash size={12} />}
            onClick={() => setIsDeleteAllModalOpen(true)}
            disabled={loading || isDeletingAll}
            className="self-start sm:self-auto shadow-rose-900/30"
          >
            Delete All Resumes ({resumes.length})
          </Button>
        )}
      </div>

      {/* Control Bar & Bulk Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F7682]" size={13} />
          <input
            type="text"
            placeholder="Search resumes by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D]/60 transition-all text-xs"
          />
        </div>

        {/* Bulk Action Bar if items are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-[#171A1F] border border-rose-500/30 px-4 py-2 rounded-xl">
            <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
              <FaLayerGroup className="text-[#F5B83D]" size={13} />
              <span>
                <strong className="text-[#F5B83D]">{selectedIds.length}</strong> selected
              </span>
            </span>
            <button
              onClick={() => setIsDeleteSelectedModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <FaTrash size={11} />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-[#A7ADB7] hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* History Table Card */}
      <Card className="overflow-hidden p-0 bg-[#121519] border-[#292D33]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0D0F12] border-b border-[#292D33] text-[10px] text-[#A7ADB7] font-extrabold uppercase tracking-widest">
                <th className="px-4 py-4 w-12 text-center">
                  <button
                    onClick={toggleSelectAllPaginated}
                    disabled={paginatedResumes.length === 0}
                    className="text-[#A7ADB7] hover:text-[#F5B83D] disabled:opacity-40 transition-colors cursor-pointer"
                    title={isAllPaginatedSelected ? 'Deselect all on this page' : 'Select all on this page'}
                  >
                    {isAllPaginatedSelected ? (
                      <FaCheckSquare className="text-[#F5B83D]" size={14} />
                    ) : (
                      <FaSquare size={14} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">File Size</th>
                <th className="px-6 py-4">File Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292D33]/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[#A7ADB7] text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin text-[#F5B83D]" size={16} />
                      <span>Loading resume history...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedResumes.length > 0 ? (
                paginatedResumes.map((item) => {
                  const itemId = item._id || item.id;
                  const name = item.originalName || item.fileName || 'Untitled Resume';
                  const fileTypeLabel = getFileTypeLabel(item.fileType, name);
                  const isSelected = selectedIds.includes(itemId);

                  return (
                    <tr
                      key={itemId}
                      className={`hover:bg-[#171A1F] transition-colors group ${
                        isSelected ? 'bg-[#F5B83D]/5' : ''
                      }`}
                    >
                      <td className="px-4 py-4.5 text-center">
                        <button
                          onClick={() => toggleSelectResume(itemId)}
                          className="text-[#6F7682] hover:text-[#F5B83D] transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <FaCheckSquare className="text-[#F5B83D]" size={14} />
                          ) : (
                            <FaSquare size={14} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#F5B83D]/10 border border-[#F5B83D]/25 text-[#F5B83D] rounded-lg group-hover:scale-105 transition-transform">
                            <FaFileAlt size={14} />
                          </div>
                          <div>
                            <span
                              className="text-xs font-bold text-[#F5F5F5] block truncate max-w-xs md:max-w-md"
                              title={name}
                            >
                              {name}
                            </span>
                            <span className="text-[10px] text-[#A7ADB7] font-semibold">{item.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-xs text-[#A7ADB7] font-medium">
                        {formatDate(item.uploadDate)}
                      </td>
                      <td className="px-6 py-4.5 text-xs text-[#A7ADB7] font-medium">
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
                            onClick={() => navigate(`/dashboard/analysis/${itemId}`)}
                            className="p-2 text-xs font-semibold rounded-lg text-[#F5B83D] hover:text-[#08090B] hover:bg-[#F5B83D] border border-[#F5B83D]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="View Complete Resume Analysis Dashboard"
                          >
                            <FaInfoCircle size={12} />
                            <span className="hidden sm:inline">Analysis</span>
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/report?id=${itemId}`)}
                            className="p-2 text-xs font-semibold rounded-lg text-[#FFD166] hover:text-[#08090B] hover:bg-[#FFD166] border border-[#FFD166]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="View ATS Evaluation Report"
                          >
                            <FaInfoCircle size={12} />
                            <span className="hidden sm:inline">ATS Score</span>
                          </button>
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="p-2 text-xs font-semibold rounded-lg text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#171A1F] border border-[#292D33] transition-all flex items-center gap-1.5 cursor-pointer"
                            title="View Details"
                          >
                            <FaInfoCircle size={12} />
                            <span className="hidden sm:inline">Details</span>
                          </button>
                          <button
                            onClick={() => handleDelete(itemId, name)}
                            disabled={deletingId === itemId}
                            className="p-2 text-xs font-semibold rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/10 border border-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
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
                  <td colSpan="6" className="px-6 py-12 text-center text-[#A7ADB7] text-xs">
                    {resumes.length === 0
                      ? 'No resumes uploaded yet. Upload your first resume to get started.'
                      : 'No resume files found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#292D33] flex items-center justify-between">
            <span className="text-xs text-[#A7ADB7]">
              Showing <span className="font-bold text-[#F5F5F5]">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-bold text-[#F5F5F5]">{Math.min(currentPage * itemsPerPage, filteredResumes.length)}</span> of{' '}
              <span className="font-bold text-[#F5F5F5]">{filteredResumes.length}</span> resumes
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 rounded-lg bg-[#0D0F12] border border-[#292D33] text-[#A7ADB7] hover:text-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Previous Page"
              >
                <FaChevronLeft size={10} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border cursor-pointer
                    ${currentPage === i + 1
                      ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166] border-[#FFD166] text-[#08090B] shadow-md font-bold'
                      : 'bg-[#0D0F12] border-[#292D33] text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#171A1F]'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 rounded-lg bg-[#0D0F12] border border-[#292D33] text-[#A7ADB7] hover:text-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
            <div className="bg-[#0D0F12] p-4 rounded-xl border border-[#292D33] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#6F7682] font-semibold">Original File Name:</span>
                <span className="text-[#F5F5F5] font-bold truncate max-w-[200px]" title={selectedResume.originalName}>
                  {selectedResume.originalName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7682] font-semibold">Stored File Name:</span>
                <span className="text-[#A7ADB7] font-mono text-[11px] truncate max-w-[200px]" title={selectedResume.fileName}>
                  {selectedResume.fileName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7682] font-semibold">File Type:</span>
                <span className="text-[#F5F5F5] font-semibold">{selectedResume.fileType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7682] font-semibold">File Size:</span>
                <span className="text-[#F5F5F5] font-semibold">{getFriendlySize(selectedResume.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7682] font-semibold">Upload Date:</span>
                <span className="text-[#F5F5F5] font-semibold">{formatDate(selectedResume.uploadDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7682] font-semibold">Upload Status:</span>
                <Badge variant="success">{selectedResume.status || 'Uploaded'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7682] font-semibold">Database Record ID:</span>
                <span className="text-[#A7ADB7] font-mono text-[10px]">{selectedResume._id || selectedResume.id}</span>
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

      {/* Delete All Resumes Confirmation Modal */}
      <Modal
        isOpen={isDeleteAllModalOpen}
        onClose={() => !isDeletingAll && setIsDeleteAllModalOpen(false)}
        title="Delete All Resumes"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 mt-0.5">
              <FaExclamationTriangle size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-200">
                Permanently Delete All {resumes.length} Resumes?
              </h4>
              <p className="text-xs text-[#A7ADB7] leading-relaxed">
                This action is <strong>irreversible</strong>. All uploaded resume files on disk, extracted text, ATS evaluation scores, Job Match data, and AI analysis reports associated with your profile will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="bg-[#0D0F12] p-3.5 rounded-xl border border-[#292D33] text-xs text-[#A7ADB7] space-y-1.5">
            <div className="flex justify-between">
              <span>Total resumes to remove:</span>
              <span className="font-bold text-[#F5F5F5]">{resumes.length} documents</span>
            </div>
            <div className="flex justify-between">
              <span>Physical files cleanup:</span>
              <span className="font-semibold text-emerald-400">Automatic</span>
            </div>
            <div className="flex justify-between">
              <span>Cascade analytics cleanup:</span>
              <span className="font-semibold text-emerald-400">Complete</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteAllModalOpen(false)}
              disabled={isDeletingAll}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isDeletingAll}
              icon={<FaTrash size={12} />}
              onClick={handleConfirmDeleteAll}
            >
              Yes, Delete All ({resumes.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Selected Resumes Confirmation Modal */}
      <Modal
        isOpen={isDeleteSelectedModalOpen}
        onClose={() => !isDeletingSelected && setIsDeleteSelectedModalOpen(false)}
        title="Delete Selected Resumes"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 mt-0.5">
              <FaExclamationTriangle size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-200">
                Delete {selectedIds.length} Selected Resume(s)?
              </h4>
              <p className="text-xs text-[#A7ADB7] leading-relaxed">
                Are you sure you want to permanently delete the selected resumes? Their files, ATS scores, and AI evaluations will be removed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteSelectedModalOpen(false)}
              disabled={isDeletingSelected}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isDeletingSelected}
              icon={<FaTrash size={12} />}
              onClick={handleConfirmDeleteSelected}
            >
              Yes, Delete Selected ({selectedIds.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

