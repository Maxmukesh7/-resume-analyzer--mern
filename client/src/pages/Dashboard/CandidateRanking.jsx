import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FaUsers,
  FaTrophy,
  FaFileAlt,
  FaCloudUploadAlt,
  FaSearch,
  FaSlidersH,
  FaFilePdf,
  FaSpinner,
  FaTimes,
  FaEye,
  FaTrash,
  FaBriefcase,
  FaSync,
  FaHistory
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';
import recruiterService from '../../services/recruiterService';
import { exportToPDF } from '../../utils/exportUtils';

export default function CandidateRanking() {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Tabs: 'create' | 'results' | 'history'
  const [activeTab, setActiveTab] = useState('create');

  // Form Inputs
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Scoring Weights (Percentages)
  const [weights, setWeights] = useState({
    atsWeight: 30,
    jobMatchWeight: 40,
    skillWeight: 15,
    experienceWeight: 10,
    educationWeight: 5
  });

  // Processing & Loading States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rankingResult, setRankingResult] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [minOverallScore, setMinOverallScore] = useState(0);
  const [experienceFilter, setExperienceFilter] = useState('all');

  // Candidate Detail Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage] = useState(1);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  // Fetch History on Tab Switch
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(historyPage);
    }
  }, [activeTab, historyPage]);

  const fetchHistory = async (page = 1) => {
    try {
      setHistoryLoading(true);
      const res = await recruiterService.getRankings({ page, limit: 10 });
      if (res.success && res.data) {
        setHistoryList(res.data.rankings || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch ranking history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const filtered = newFiles.filter((f) => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return validExtensions.includes(ext);
    });

    if (filtered.length < newFiles.length) {
      showToast('Some unsupported files were skipped. Only PDF, DOC, and DOCX files are allowed.', 'warning');
    }

    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name + f.size));
      const uniqueNew = filtered.filter((f) => !existingNames.has(f.name + f.size));
      const combined = [...prev, ...uniqueNew];
      if (combined.length > 30) {
        showToast('Maximum limit of 30 resumes per batch. Truncated to 30 files.', 'warning');
        return combined.slice(0, 30);
      }
      return combined;
    });
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Batch for Ranking
  const handleSubmitRanking = async (e) => {
    e.preventDefault();

    if (!jobTitle.trim()) {
      showToast('Please enter a target Job Title.', 'error');
      return;
    }

    if (!jobDescription.trim() || jobDescription.trim().length < 5) {
      showToast('Please enter a Job Description or target skills list (at least 5 characters).', 'error');
      return;
    }

    if (selectedFiles.length === 0) {
      showToast('Please upload at least one candidate resume file.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('jobTitle', jobTitle.trim());
      formData.append('companyName', companyName.trim() || 'Target Company');
      formData.append('jobDescription', jobDescription.trim());

      // Normalized Decimal Weights (Sum to exactly 1.0)
      const totalRaw = (weights.atsWeight || 0) + (weights.jobMatchWeight || 0) + (weights.skillWeight || 0) + (weights.experienceWeight || 0) + (weights.educationWeight || 0);
      const safeTotal = totalRaw > 0 ? totalRaw : 100;
      const normalizedWeights = {
        jobMatchWeight: Number(((weights.jobMatchWeight || 40) / safeTotal).toFixed(4)),
        atsWeight: Number(((weights.atsWeight || 30) / safeTotal).toFixed(4)),
        skillWeight: Number(((weights.skillWeight || 15) / safeTotal).toFixed(4)),
        experienceWeight: Number(((weights.experienceWeight || 10) / safeTotal).toFixed(4)),
        educationWeight: Number(((weights.educationWeight || 5) / safeTotal).toFixed(4))
      };
      formData.append('weights', JSON.stringify(normalizedWeights));

      selectedFiles.forEach((file) => {
        formData.append('resumes', file);
      });

      showToast(`Uploading and ranking ${selectedFiles.length} resumes...`, 'info');

      const res = await recruiterService.rankResumes(formData, (progress) => {
        setUploadProgress(progress);
      });

      if (res.success && res.data) {
        setRankingResult(res.data);
        setActiveTab('results');
        showToast(res.message || 'Candidate batch ranked successfully!', 'success');
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        showToast('Recruiter or Admin access required. Please sign in with an Admin or Recruiter account to rank candidate batches.', 'error');
      } else if (status === 401) {
        showToast('Your session has expired. Please log in again.', 'error');
      } else if (status === 404) {
        showToast('Ranking service endpoint not found. Please verify backend server is running.', 'error');
      } else {
        showToast(err.response?.data?.message || err.message || 'Failed to process and rank candidate resumes.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // View specific session from History
  const handleViewHistoricalSession = async (sessionId) => {
    try {
      setHistoryLoading(true);
      const res = await recruiterService.getRankingById(sessionId);
      if (res.success && res.data) {
        setRankingResult(res.data);
        setActiveTab('results');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load ranking details.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Delete session from History
  const handleDeleteSession = async (sessionId, title) => {
    if (!window.confirm(`Are you sure you want to delete the ranking report for '${title}'?`)) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      const res = await recruiterService.deleteRanking(sessionId);
      if (res.success) {
        showToast('Ranking report deleted successfully.', 'success');
        setHistoryList((prev) => prev.filter((item) => item._id !== sessionId));
        if (rankingResult && rankingResult._id === sessionId) {
          setRankingResult(null);
          setActiveTab('create');
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete ranking report.', 'error');
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Filtered Candidates List
  const filteredCandidates = (rankingResult?.candidates || []).filter((c) => {
    if (c.status === 'failed') return true;

    // Search query (Name, Email, Skills)
    const matchesSearch =
      !searchQuery.trim() ||
      c.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.matchedSkills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Score thresholds
    const matchesOverall = c.overallScore >= minOverallScore;

    // Experience filter
    const expCount = c.parsedData?.experience?.length || 0;
    let matchesExp = true;
    if (experienceFilter === 'experienced') matchesExp = expCount >= 2;
    else if (experienceFilter === 'mid') matchesExp = expCount === 1;
    else if (experienceFilter === 'fresher') matchesExp = expCount === 0;

    return matchesSearch && matchesOverall && matchesExp;
  });

  // Top 3 Podium Candidates
  const topThree = (rankingResult?.candidates || [])
    .filter((c) => c.status === 'completed')
    .slice(0, 3);

  // PDF Report Export
  const handleExportPDF = () => {
    if (!rankingResult || !filteredCandidates.length) return;

    const headers = ['Rank', 'Candidate Name', 'Email', 'Overall Score', 'ATS Score', 'Job Match %', 'Key Matched Skills'];
    const rows = filteredCandidates.map((c) => [
      `#${c.rank}`,
      c.candidateName,
      c.email || 'N/A',
      `${c.overallScore}%`,
      `${c.atsScore}%`,
      `${c.jobMatchScore}%`,
      (c.matchedSkills || []).slice(0, 4).join(', ') || 'None'
    ]);

    exportToPDF(
      `${rankingResult.jobTitle} — Candidate Ranking Report (${rankingResult.companyName})`,
      headers,
      rows,
      `${rankingResult.jobTitle.replace(/\s+/g, '_')}_Candidate_Rankings.pdf`
    );
    showToast('Printable PDF generated!', 'success');
  };

  const getFriendlySize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20">
          🥇 Rank 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 shadow-md shadow-slate-400/20">
          🥈 Rank 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-700/20">
          🥉 Rank 3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <FaUsers size={12} /> Recruiter Intelligence Hub
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Multiple Resume Upload & <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">Candidate Ranking</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Upload candidate batches, automatically extract structured credentials, match against target Job Descriptions, and generate transparent, weighted candidate rankings.
            </p>
          </div>

          {/* Navigation Tab Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaCloudUploadAlt size={14} /> New Ranking
            </button>

            {rankingResult && (
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'results'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FaTrophy size={14} /> Current Results ({rankingResult.candidates?.length || 0})
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaHistory size={14} /> Past Sessions
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CREATE NEW RANKING BATCH
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmitRanking} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Job Details & Dropzone */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Information Card */}
              <Card className="p-6 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                  <FaBriefcase className="text-indigo-400" size={16} />
                  <span>Job Details & Requirements</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Target Job Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Full Stack Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TechCorp Solutions"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Job Description Text <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-slate-500 font-normal">Min 20 characters</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Paste full Job Description containing required skills, responsibilities, years of experience, and qualifications..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 leading-relaxed font-mono text-xs"
                  />
                </div>
              </Card>

              {/* Multiple Resumes File Dropzone */}
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FaCloudUploadAlt className="text-indigo-400" size={18} />
                    <span>Upload Candidate Resumes (Batch)</span>
                  </h3>
                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Clear All ({selectedFiles.length})
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-900/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center group"
                >
                  <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                    <FaCloudUploadAlt size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Drag & drop multiple resumes here</p>
                    <p className="text-xs text-slate-500 mt-1">or click to browse from device (PDF, DOC, DOCX up to 30 files)</p>
                  </div>
                </div>

                {/* Selected Files Badge List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>Selected Resumes ({selectedFiles.length})</span>
                      <span>Total: {getFriendlySize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                            <FaFileAlt className="text-indigo-400 shrink-0" size={14} />
                            <span className="truncate font-medium text-white max-w-[280px]" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({getFriendlySize(file.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(idx);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Remove file"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right 1 Col: Configurable Weights & Submit */}
            <div className="space-y-6">
              {/* Configurable Weights Card */}
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FaSlidersH className="text-indigo-400" size={15} />
                    <span>Ranking Weights</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setWeights({
                        atsWeight: 30,
                        jobMatchWeight: 40,
                        skillWeight: 15,
                        experienceWeight: 10,
                        educationWeight: 5
                      });
                      showToast('Weights reset to defaults (30/40/15/10/5)', 'info');
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
                  >
                    Reset Defaults
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Customize the mathematical priority of each evaluation parameter in computing the candidate overall score.
                </p>

                <div className="space-y-4">
                  {/* Job Match Weight */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-indigo-300">Job Description Match</span>
                      <span className="text-white">
                        {weights.jobMatchWeight}%
                        {weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight !== 100 && (
                          <span className="text-indigo-400 text-[10px] ml-1">
                            (eff: {Math.round((weights.jobMatchWeight / ((weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight) || 1)) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights.jobMatchWeight}
                      onChange={(e) => setWeights({ ...weights, jobMatchWeight: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* ATS Score Weight */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-blue-300">ATS Resume Quality</span>
                      <span className="text-white">
                        {weights.atsWeight}%
                        {weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight !== 100 && (
                          <span className="text-blue-400 text-[10px] ml-1">
                            (eff: {Math.round((weights.atsWeight / ((weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight) || 1)) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights.atsWeight}
                      onChange={(e) => setWeights({ ...weights, atsWeight: Number(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Skill Match Weight */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-teal-300">Direct Skill Match</span>
                      <span className="text-white">
                        {weights.skillWeight}%
                        {weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight !== 100 && (
                          <span className="text-teal-400 text-[10px] ml-1">
                            (eff: {Math.round((weights.skillWeight / ((weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight) || 1)) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights.skillWeight}
                      onChange={(e) => setWeights({ ...weights, skillWeight: Number(e.target.value) })}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>

                  {/* Experience Match Weight */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-amber-300">Work Experience Depth</span>
                      <span className="text-white">
                        {weights.experienceWeight}%
                        {weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight !== 100 && (
                          <span className="text-amber-400 text-[10px] ml-1">
                            (eff: {Math.round((weights.experienceWeight / ((weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight) || 1)) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights.experienceWeight}
                      onChange={(e) => setWeights({ ...weights, experienceWeight: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Education Match Weight */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-purple-300">Academic Background</span>
                      <span className="text-white">
                        {weights.educationWeight}%
                        {weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight !== 100 && (
                          <span className="text-purple-400 text-[10px] ml-1">
                            (eff: {Math.round((weights.educationWeight / ((weights.jobMatchWeight + weights.atsWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight) || 1)) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights.educationWeight}
                      onChange={(e) => setWeights({ ...weights, educationWeight: Number(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex justify-between font-bold items-center">
                    <span>Effective Total Weight:</span>
                    <span className="text-emerald-400 font-extrabold text-xs">
                      100%
                    </span>
                  </div>
                  {weights.atsWeight + weights.jobMatchWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight !== 100 && (
                    <button
                      type="button"
                      onClick={() => {
                        const sum = weights.atsWeight + weights.jobMatchWeight + weights.skillWeight + weights.experienceWeight + weights.educationWeight || 1;
                        setWeights({
                          jobMatchWeight: Math.round((weights.jobMatchWeight / sum) * 100),
                          atsWeight: Math.round((weights.atsWeight / sum) * 100),
                          skillWeight: Math.round((weights.skillWeight / sum) * 100),
                          experienceWeight: Math.round((weights.experienceWeight / sum) * 100),
                          educationWeight: 100 - (Math.round((weights.jobMatchWeight / sum) * 100) + Math.round((weights.atsWeight / sum) * 100) + Math.round((weights.skillWeight / sum) * 100) + Math.round((weights.experienceWeight / sum) * 100))
                        });
                        showToast('Sliders auto-balanced to 100%', 'success');
                      }}
                      className="w-full py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold transition-all"
                    >
                      ⚡ Auto-balance sliders to 100%
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500">Ranking engine guarantees exactly 100% normalized weight calculation.</p>
                </div>
              </Card>

              {/* Progress & Submit Card */}
              <Card className="p-6 space-y-4">
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-indigo-300">
                      <span className="flex items-center gap-2">
                        <FaSpinner className="animate-spin" size={12} />
                        Uploading & Processing Batch...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isProcessing || selectedFiles.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner size={16} className="animate-spin" />
                      Evaluating & Ranking Candidates...
                    </>
                  ) : (
                    <>
                      <FaTrophy size={16} />
                      Rank {selectedFiles.length} Candidate{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  ⚖️ <strong className="text-slate-400">Fairness Enforced</strong>: Ranking is computed strictly on job-relevant skills, experience, education, and credentials without protected characteristics.
                </p>
              </Card>
            </div>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: RESULTS VIEW (PODIUM + TABLE + DETAIL MODAL)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'results' && rankingResult && (
        <div className="space-y-8">
          {/* Action Toolbar & Overview */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">Candidate Ranking Report</span>
              <h2 className="text-xl font-black text-white">{rankingResult.jobTitle}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {rankingResult.companyName} &bull; Processed <span className="text-emerald-400 font-bold">{rankingResult.processedCount}</span> of <span className="text-white font-bold">{rankingResult.totalResumes}</span> resumes
                {rankingResult.failedCount > 0 && <span className="text-rose-400 font-bold ml-1">({rankingResult.failedCount} failed)</span>}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleExportPDF}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <FaFilePdf size={13} className="text-rose-400" /> PDF Report
              </Button>

              <Button
                onClick={() => setActiveTab('create')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <FaSync size={12} /> New Batch
              </Button>
            </div>
          </div>

          {/* Top 3 Podium Highlights */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((candidate, idx) => {
                const medalGradients = [
                  'from-amber-500/20 via-yellow-500/10 to-transparent border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
                  'from-slate-400/20 via-slate-500/10 to-transparent border-slate-400/40 shadow-[0_0_30px_rgba(148,163,184,0.15)]',
                  'from-amber-700/20 via-amber-800/10 to-transparent border-amber-700/40 shadow-[0_0_30px_rgba(180,83,9,0.15)]'
                ];

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative p-6 rounded-3xl bg-gradient-to-b ${medalGradients[idx]} backdrop-blur-xl border flex flex-col justify-between space-y-4`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        {getRankBadge(candidate.rank)}
                        <h4 className="text-lg font-black text-white pt-2 truncate" title={candidate.candidateName}>
                          {candidate.candidateName}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">{candidate.email || 'No email provided'}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-3xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                          {candidate.overallScore}%
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Overall Score</span>
                      </div>
                    </div>

                    {/* Scores Metric Row */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
                      <div>
                        <span className="text-xs font-black text-indigo-300">{candidate.jobMatchScore}%</span>
                        <span className="text-[9px] text-slate-500 block font-semibold">Job Match</span>
                      </div>
                      <div className="border-x border-slate-800">
                        <span className="text-xs font-black text-blue-300">{candidate.atsScore}%</span>
                        <span className="text-[9px] text-slate-500 block font-semibold">ATS Score</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-teal-300">{candidate.skillMatchScore}%</span>
                        <span className="text-[9px] text-slate-500 block font-semibold">Skills</span>
                      </div>
                    </div>

                    {/* Top Matched Skills */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Key Matched Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {(candidate.matchedSkills || []).slice(0, 4).map((sk, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[10px] font-semibold">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="w-full bg-slate-800 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FaEye size={12} /> View Full Profile
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input
                  type="text"
                  placeholder="Search by candidate name, email, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Min Overall Score Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-300">
                  <span>Min Overall Score</span>
                  <span className="text-indigo-400">{minOverallScore}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minOverallScore}
                  onChange={(e) => setMinOverallScore(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5"
                />
              </div>

              {/* Experience Filter */}
              <div>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="all">All Experience Levels</option>
                  <option value="experienced">Experienced (2+ roles)</option>
                  <option value="mid">Mid-level (1 role)</option>
                  <option value="fresher">Entry / Fresher (0 roles)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Candidate Ranking Data Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">ATS Score</th>
                  <th className="py-3.5 px-4">Job Match</th>
                  <th className="py-3.5 px-4">Skills Match</th>
                  <th className="py-3.5 px-4 font-black text-white">Overall Score</th>
                  <th className="py-3.5 px-4">Recommendation</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500 italic">
                      No candidates match your active search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate, idx) => {
                    const isTop = candidate.rank <= 3;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isTop ? 'bg-indigo-950/10' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                          {getRankBadge(candidate.rank)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{candidate.candidateName}</div>
                          <div className="text-[11px] text-slate-400">{candidate.email || 'No email'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-400">
                          {candidate.atsScore}%
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-400">
                          {candidate.jobMatchScore}%
                        </td>
                        <td className="py-3.5 px-4 font-bold text-teal-400">
                          {candidate.skillMatchScore}%
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black ${
                              candidate.overallScore >= 85
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : candidate.overallScore >= 70
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {candidate.overallScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px] truncate text-slate-400 text-[11px]" title={candidate.recommendations?.[0] || 'Good profile match'}>
                          {candidate.recommendations?.[0] || 'Standard candidate match'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Button
                            onClick={() => setSelectedCandidate(candidate)}
                            size="sm"
                            className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: HISTORICAL RANKING SESSIONS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaHistory className="text-indigo-400" size={16} />
                <span>Previous Candidate Ranking Batches</span>
              </h3>
              <Button
                onClick={() => fetchHistory(historyPage)}
                size="sm"
                className="bg-slate-800 text-slate-300 text-xs"
              >
                <FaSync size={11} className={historyLoading ? 'animate-spin' : ''} /> Refresh
              </Button>
            </div>

            {historyLoading ? (
              <div className="text-center py-12 text-slate-400">
                <FaSpinner className="animate-spin mx-auto text-indigo-400" size={24} />
                <p className="text-xs mt-2">Loading past ranking sessions...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic space-y-2">
                <FaUsers className="mx-auto text-slate-600" size={32} />
                <p>No historical candidate ranking batches found.</p>
                <Button onClick={() => setActiveTab('create')} size="sm" className="bg-indigo-600 text-white mt-2">
                  Create First Ranking Batch
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {historyList.map((session) => (
                  <div
                    key={session._id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-950/40 px-3 rounded-2xl transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{session.jobTitle}</h4>
                        <Badge variant="info" className="text-[10px]">{session.companyName}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {session.processedCount} of {session.totalResumes} candidates ranked &bull; {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                      {session.topCandidate && (
                        <p className="text-xs text-emerald-400 font-semibold">
                          🥇 Top Rank: {session.topCandidate.name} ({session.topCandidate.overallScore}%)
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewHistoricalSession(session._id)}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                      >
                        <FaEye size={12} /> View Report
                      </Button>
                      <button
                        onClick={() => handleDeleteSession(session._id, session.jobTitle)}
                        disabled={deletingSessionId === session._id}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-all"
                        title="Delete session"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CANDIDATE DETAIL MODAL
         ───────────────────────────────────────────────────────────── */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={`Candidate Profile — ${selectedCandidate.candidateName}`}
          size="lg"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar text-slate-300 text-xs">
            {/* Header / Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getRankBadge(selectedCandidate.rank)}
                  <h3 className="text-lg font-black text-white">{selectedCandidate.candidateName}</h3>
                </div>
                <p className="text-slate-400">{selectedCandidate.email || 'No email provided'} {selectedCandidate.phone && `• ${selectedCandidate.phone}`}</p>
                {selectedCandidate.location && <p className="text-slate-500">📍 {selectedCandidate.location}</p>}
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center min-w-[75px]">
                  <span className="text-lg font-black text-white">{selectedCandidate.overallScore}%</span>
                  <span className="text-[9px] text-slate-500 block font-bold uppercase">Overall</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center min-w-[75px]">
                  <span className="text-lg font-black text-indigo-400">{selectedCandidate.jobMatchScore}%</span>
                  <span className="text-[9px] text-slate-500 block font-bold uppercase">Job Match</span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center min-w-[75px]">
                  <span className="text-lg font-black text-blue-400">{selectedCandidate.atsScore}%</span>
                  <span className="text-[9px] text-slate-500 block font-bold uppercase">ATS</span>
                </div>
              </div>
            </div>

            {/* Sub-Metric Scores Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-xs font-black text-teal-300">{selectedCandidate.skillMatchScore}%</span>
                <span className="text-[10px] text-slate-500 block">Skills Match</span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-xs font-black text-amber-300">{selectedCandidate.experienceMatchScore}%</span>
                <span className="text-[10px] text-slate-500 block">Experience Match</span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-xs font-black text-purple-300">{selectedCandidate.educationMatchScore}%</span>
                <span className="text-[10px] text-slate-500 block">Education Match</span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-xs font-black text-rose-300">{selectedCandidate.projectMatchScore}%</span>
                <span className="text-[10px] text-slate-500 block">Project Match</span>
              </div>
            </div>

            {/* Skills Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Skills Analysis</h4>
              <div className="space-y-2">
                {(() => {
                  const uniqueMatched = Array.from(new Map((selectedCandidate.matchedSkills || []).map(s => [s.toLowerCase().trim(), s])).values());
                  const uniqueMissing = Array.from(new Map((selectedCandidate.missingSkills || []).map(s => [s.toLowerCase().trim(), s])).values());

                  return (
                    <>
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">Matched Skills ({uniqueMatched.length}):</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {uniqueMatched.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">No direct matching skills found.</span>
                          ) : (
                            uniqueMatched.map((sk, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
                                ✓ {sk}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {uniqueMissing.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-rose-400 font-bold uppercase">Missing JD Requirements ({uniqueMissing.length}):</span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {uniqueMissing.map((sk, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-300 text-xs font-medium">
                                ✕ {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Strengths & Recommendations */}
            {selectedCandidate.recommendations?.length > 0 && (
              <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Recruiter Assessment Notes</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                  {selectedCandidate.recommendations.map((rec, rIdx) => (
                    <li key={rIdx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parsed Experience */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parsed Work Experience</h4>
              {(selectedCandidate.parsedData?.experience || []).length === 0 ? (
                <p className="text-slate-500 italic">No formal work experience entries listed.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCandidate.parsedData.experience.map((exp, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white">{exp.role || 'Role'}</span>
                        <span className="text-[10px] text-slate-500">{exp.period || ''}</span>
                      </div>
                      <p className="text-indigo-400 font-medium">{exp.company}</p>
                      {exp.bulletPoints?.length > 0 && (
                        <ul className="list-disc list-inside text-slate-400 text-[11px] pt-1 space-y-0.5">
                          {exp.bulletPoints.map((bp, bIdx) => (
                            <li key={bIdx}>{bp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parsed Projects */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Projects</h4>
              {(selectedCandidate.parsedData?.projects || []).length === 0 ? (
                <p className="text-slate-500 italic">No project entries listed.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCandidate.parsedData.projects.map((proj, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                      <span className="font-bold text-white">{proj.title || 'Project'}</span>
                      {proj.technologies?.length > 0 && (
                        <p className="text-teal-400 text-[10px]">Stack: {proj.technologies.join(', ')}</p>
                      )}
                      {proj.description && <p className="text-slate-400 text-[11px]">{proj.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
