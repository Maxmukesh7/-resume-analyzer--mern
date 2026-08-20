import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaLinkedin, 
  FaGithub, 
  FaGlobe, 
  FaGraduationCap, 
  FaBriefcase, 
  FaCode, 
  FaCertificate, 
  FaLanguage, 
  FaFileAlt, 
  FaSpinner, 
  FaArrowLeft, 
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLightbulb,
  FaRobot,
  FaChartBar,
  FaMagic,
  FaTrophy,
  FaDownload,
  FaPrint,
  FaCopy,
  FaExternalLinkAlt,
  FaAward
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import { useToast } from '../../components/Common/Toast';
import { 
  getCompleteResumeAnalysis, 
  parseResume, 
  analyzeResume 
} from '../../services/resumeService';
import { analyzeResumeWithAI } from '../../services/aiService';

export default function ResumeAnalysisDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryingAi, setRetryingAi] = useState(false);
  const [retryingAts, setRetryingAts] = useState(false);
  const [retryingParse, setRetryingParse] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ats' | 'ai' | 'details'

  const fetchAnalysis = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getCompleteResumeAnalysis(id);
      const payload = res.data || res;
      setData(payload);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load complete resume analysis.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  const handleRetryAi = async () => {
    try {
      setRetryingAi(true);
      showToast('Generating AI Insights with Gemini...', 'info');
      await analyzeResumeWithAI(id, true);
      showToast('AI Analysis generated successfully!', 'success');
      await fetchAnalysis(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate AI analysis.', 'error');
    } finally {
      setRetryingAi(false);
    }
  };

  const handleRetryAts = async () => {
    try {
      setRetryingAts(true);
      showToast('Recalculating ATS Score...', 'info');
      await analyzeResume(id, true);
      showToast('ATS Evaluation updated successfully!', 'success');
      await fetchAnalysis(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to recalculate ATS score.', 'error');
    } finally {
      setRetryingAts(false);
    }
  };

  const handleRetryParse = async () => {
    try {
      setRetryingParse(true);
      showToast('Reparsing resume text and structured details...', 'info');
      await parseResume(id, true);
      showToast('Resume parsed successfully!', 'success');
      await fetchAnalysis(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to re-parse resume.', 'error');
    } finally {
      setRetryingParse(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = data?.aiAnalysis?.summary || data?.resume?.parsedData?.summary;
    if (summary) {
      navigator.clipboard.writeText(summary);
      showToast('Professional summary copied to clipboard!', 'success');
    }
  };

  const getFriendlySize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-[#FFD166] border-[#F5B83D]/40 bg-[#F5B83D]/10';
    if (score >= 80) return 'text-[#F5B83D] border-[#F5B83D]/30 bg-[#F5B83D]/10';
    if (score >= 70) return 'text-[#FFD166] border-[#FFD166]/25 bg-[#171A1F]';
    return 'text-[#F87171] border-[#F87171]/30 bg-[#F87171]/10';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return <Badge variant="success">Excellent</Badge>;
    if (score >= 80) return <Badge variant="info">Very Good</Badge>;
    if (score >= 70) return <Badge variant="warning">Good</Badge>;
    return <Badge variant="danger">Needs Improvement</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 text-[#A7ADB7]">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-[#292D33] border-t-[#F5B83D] animate-spin" />
          <FaRobot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#F5B83D]" size={20} />
        </div>
        <p className="text-sm font-semibold text-[#F5F5F5]">Loading Complete Resume Analysis...</p>
        <p className="text-xs text-[#A7ADB7]">Aggregating parsed data, ATS metrics, and Gemini AI insights.</p>
      </div>
    );
  }

  if (!data || !data.resume) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto text-center py-16">
        <Card className="p-8 space-y-4 bg-[#121519] border-[#292D33]">
          <FaExclamationTriangle className="text-[#F5B83D] mx-auto" size={40} />
          <h2 className="text-xl font-bold text-[#F5F5F5]">Resume Analysis Not Found</h2>
          <p className="text-xs text-[#A7ADB7] max-w-md mx-auto">
            The requested resume record could not be loaded. Please ensure it exists and you have permissions.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button icon={<FaArrowLeft size={12} />} onClick={() => navigate('/dashboard/history')}>
              Back to History
            </Button>
            <Button variant="primary" icon={<FaSync size={12} />} onClick={() => fetchAnalysis()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { resume, atsAnalysis, aiAnalysis, status } = data;
  const parsed = resume.parsedData || {};
  const isParsed = status?.isParsed || resume.parseStatus === 'parsed';
  const hasAts = Boolean(atsAnalysis && typeof atsAnalysis.overallScore === 'number');
  const hasAi = Boolean(aiAnalysis && aiAnalysis.summary);

  return (
    <div className="space-y-8 max-w-6xl mx-auto print:max-w-none print:m-0 print:p-0">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/dashboard/history')}
            className="p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#A7ADB7] hover:text-[#F5F5F5] hover:border-[#F5B83D]/40 transition-all shrink-0 mt-0.5 print:hidden cursor-pointer"
            title="Back to History"
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFD166] bg-[#171A1F] px-2.5 py-0.5 rounded-md border border-[#F5B83D]/30">
                Complete Analysis Dashboard
              </span>
              <span className="text-[#6F7682]">&bull;</span>
              <span className="text-xs text-[#A7ADB7]">
                Uploaded {new Date(resume.uploadDate || resume.createdAt).toLocaleDateString()}
              </span>
              <span className="text-[#6F7682]">&bull;</span>
              <span className="text-xs text-[#A7ADB7]">{getFriendlySize(resume.fileSize)}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-wide mt-1 truncate max-w-xl" title={resume.originalName}>
              {parsed.fullName ? `${parsed.fullName}'s Resume Analysis` : resume.originalName}
            </h1>
            <p className="text-xs text-[#A7ADB7] font-medium mt-0.5">
              File: <span className="text-[#F5F5F5] font-mono">{resume.originalName}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          <Button
            size="sm"
            variant="outline"
            icon={<FaPrint size={13} />}
            onClick={handlePrint}
            title="Print or Save PDF"
          >
            Print / Export
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<FaMagic size={13} />}
            onClick={() => navigate(`/dashboard/improve/${resume._id}`)}
          >
            Improve Resume
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<FaBriefcase size={13} />}
            onClick={() => navigate(`/dashboard/job-match?id=${resume._id}`)}
          >
            Match Job
          </Button>
        </div>
      </div>

      {/* Partial Failure Warning Banners */}
      <AnimatePresence>
        {!hasAi && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-3 text-[#FFD166]">
              <FaExclamationTriangle size={18} className="shrink-0 text-[#F5B83D]" />
              <span>
                <strong>ATS Analysis completed.</strong> AI analysis could not be completed or is pending.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={retryingAi}
              icon={<FaSync className={retryingAi ? 'animate-spin' : ''} size={12} />}
              onClick={handleRetryAi}
            >
              {retryingAi ? 'Generating AI...' : 'Retry AI Analysis'}
            </Button>
          </motion.div>
        )}

        {!hasAts && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-3 text-[#F87171]">
              <FaExclamationTriangle size={18} className="shrink-0 text-[#F87171]" />
              <span>
                <strong>ATS Score Evaluation pending or failed.</strong>
              </span>
            </div>
            <Button
              size="sm"
              variant="danger"
              disabled={retryingAts}
              icon={<FaSync className={retryingAts ? 'animate-spin' : ''} size={12} />}
              onClick={handleRetryAts}
            >
              {retryingAts ? 'Calculating...' : 'Retry ATS Analysis'}
            </Button>
          </motion.div>
        )}

        {!isParsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-3 text-[#F87171]">
              <FaExclamationTriangle size={18} className="shrink-0 text-[#F87171]" />
              <span>
                <strong>Parsing failed:</strong> {resume.parseError || 'Could not parse document structure.'}
              </span>
            </div>
            <Button
              size="sm"
              variant="danger"
              disabled={retryingParse}
              icon={<FaSync className={retryingParse ? 'animate-spin' : ''} size={12} />}
              onClick={handleRetryParse}
            >
              {retryingParse ? 'Parsing...' : 'Retry Parsing'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP ROW: Candidate Info & ATS Score Summary Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Information Card */}
        <Card className="lg:col-span-2 p-6 relative overflow-hidden flex flex-col justify-between bg-[#121519] border-[#292D33]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#F5B83D]/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between border-b border-[#292D33] pb-4 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-gradient-to-tr from-[#F5B83D] to-[#FFD166] rounded-2xl text-[#08090B] font-bold shadow-lg shadow-[#F5B83D]/20">
                  <FaUser size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#F5F5F5]">
                    {parsed.fullName || 'Candidate Profile'}
                  </h3>
                  <p className="text-xs text-[#A7ADB7] font-semibold">
                    {parsed.experience?.[0]?.role || 'Technical Professional'}
                  </p>
                </div>
              </div>

              <Badge variant={isParsed ? 'success' : 'neutral'}>
                {isParsed ? 'Parsed & Verified' : 'Pending'}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                <FaEnvelope className="text-[#F5B83D] shrink-0" size={14} />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">Email</span>
                  <span className="text-[#F5F5F5] font-semibold truncate block" title={parsed.email}>
                    {parsed.email || 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                <FaPhone className="text-[#FFD166] shrink-0" size={14} />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">Phone</span>
                  <span className="text-[#F5F5F5] font-semibold truncate block" title={parsed.phone}>
                    {parsed.phone || 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                <FaMapMarkerAlt className="text-[#F87171] shrink-0" size={14} />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">Location</span>
                  <span className="text-[#F5F5F5] font-semibold truncate block" title={parsed.location}>
                    {parsed.location || 'Not specified'}
                  </span>
                </div>
              </div>

              {parsed.linkedin ? (
                <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                  <FaLinkedin className="text-[#60A5FA] shrink-0" size={14} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">LinkedIn</span>
                    <a
                      href={parsed.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD166] hover:underline font-semibold truncate block"
                    >
                      {parsed.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                  <FaGithub className="text-[#F5F5F5] shrink-0" size={14} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">GitHub</span>
                    <span className="text-[#A7ADB7] font-semibold">
                      {parsed.github ? (
                        <a href={parsed.github} target="_blank" rel="noopener noreferrer" className="text-[#FFD166] hover:underline">
                          {parsed.github.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : 'Not specified'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links Row if both LinkedIn and GitHub exist */}
          {parsed.linkedin && (parsed.github || parsed.portfolio) && (
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#292D33] text-xs">
              {parsed.github && (
                <a
                  href={parsed.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#FFD166] hover:underline font-semibold"
                >
                  <FaGithub size={13} />
                  <span>GitHub Profile</span>
                  <FaExternalLinkAlt size={9} />
                </a>
              )}
              {parsed.portfolio && (
                <a
                  href={parsed.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#F5B83D] hover:underline font-semibold"
                >
                  <FaGlobe size={13} />
                  <span>Portfolio Site</span>
                  <FaExternalLinkAlt size={9} />
                </a>
              )}
            </div>
          )}
        </Card>

        {/* ATS Score Gauge Card */}
        <Card className="p-6 flex flex-col justify-between relative overflow-hidden bg-[#121519] border-[#292D33]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5B83D]/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between border-b border-[#292D33] pb-3 mb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
                <FaTrophy className="text-[#F5B83D]" size={14} />
                <span>Overall ATS Score</span>
              </h3>
              {hasAts && getScoreBadge(atsAnalysis.overallScore)}
            </div>

            {hasAts ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center">
                  <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center transition-all ${getScoreColor(atsAnalysis.overallScore)}`}>
                    <span className="text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
                      {atsAnalysis.overallScore}
                    </span>
                    <span className="text-[11px] font-bold text-[#A7ADB7] uppercase tracking-wider">
                      out of 100
                    </span>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <p className="text-xs font-bold text-[#F5F5F5]">
                    Rating: <span className="text-[#FFD166]">{atsAnalysis.ratingLabel || 'Good'}</span>
                  </p>
                  <p className="text-[11px] text-[#A7ADB7] mt-0.5">
                    Deterministic score computed across 10 evaluation categories
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#A7ADB7] text-xs">
                <FaSpinner className="animate-spin text-[#F5B83D] mx-auto mb-2" size={24} />
                <span>Calculating ATS evaluation metrics...</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#292D33] flex items-center justify-between text-xs">
            <Link
              to={`/dashboard/report?id=${resume._id}`}
              className="text-[#FFD166] hover:text-[#F5B83D] font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>View Detailed ATS Report</span>
              <FaExternalLinkAlt size={10} />
            </Link>
            {hasAts && (
              <span className="text-[11px] text-[#A7ADB7] font-semibold">
                {atsAnalysis.keywordAnalysis?.keywordCount || parsed.skills?.length || 0} keywords found
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Professional Summary Card */}
      {(aiAnalysis?.summary || parsed.summary) && (
        <Card className="p-6 space-y-3 relative overflow-hidden bg-[#121519] border-[#292D33]">
          <div className="flex items-center justify-between border-b border-[#292D33] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] rounded-xl">
                <FaRobot size={15} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Professional Executive Summary
                </h3>
                <span className="text-[10px] text-[#FFD166] font-semibold">
                  {aiAnalysis?.summary ? 'Google Gemini AI Analysis Engine' : 'Extracted from Resume Document'}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={<FaCopy size={11} />}
              onClick={handleCopySummary}
              title="Copy summary"
            >
              Copy
            </Button>
          </div>

          <p className="text-xs text-[#F5F5F5] leading-relaxed font-normal bg-[#0D0F12] p-4 rounded-xl border border-[#292D33]">
            {aiAnalysis?.summary || parsed.summary}
          </p>
        </Card>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-[#292D33] gap-8 text-xs font-bold uppercase tracking-wider overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3.5 transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#F5B83D] text-[#FFD166]'
              : 'border-transparent text-[#A7ADB7] hover:text-[#F5F5F5]'
          }`}
        >
          <FaTrophy size={13} />
          <span>ATS Metrics & Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3.5 transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ai'
              ? 'border-[#F5B83D] text-[#FFD166]'
              : 'border-transparent text-[#A7ADB7] hover:text-[#F5F5F5]'
          }`}
        >
          <FaRobot size={13} />
          <span>AI Insights & Roadmap</span>
          {hasAi && <span className="w-2 h-2 rounded-full bg-[#F5B83D]" />}
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3.5 transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'details'
              ? 'border-[#F5B83D] text-[#FFD166]'
              : 'border-transparent text-[#A7ADB7] hover:text-[#F5F5F5]'
          }`}
        >
          <FaFileAlt size={13} />
          <span>Parsed Resume Details</span>
        </button>
      </div>

      {/* TAB 1: ATS SCORE & BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section Scores Grid */}
          {hasAts && (
            <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
              <div className="flex items-center justify-between border-b border-[#292D33] pb-3">
                <div className="flex items-center gap-2">
                  <FaChartBar className="text-[#F5B83D]" size={16} />
                  <h3 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                    Category Score Breakdown
                  </h3>
                </div>
                <span className="text-[11px] text-[#A7ADB7]">Weight-adjusted evaluation criteria</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Technical Skills', score: atsAnalysis.skillsScore, weight: '20%' },
                  { label: 'Work Experience', score: atsAnalysis.experienceScore, weight: '20%' },
                  { label: 'Education Quality', score: atsAnalysis.educationScore, weight: '15%' },
                  { label: 'Projects Portfolio', score: atsAnalysis.projectsScore, weight: '10%' },
                  { label: 'Keyword Quality', score: atsAnalysis.keywordScore, weight: '10%' },
                  { label: 'Document Structure', score: atsAnalysis.structureScore, weight: '10%' },
                  { label: 'Formatting & Layout', score: atsAnalysis.formattingScore, weight: '10%' },
                  { label: 'Achievements & Impact', score: atsAnalysis.achievementsScore, weight: '5%' },
                  { label: 'Certifications', score: atsAnalysis.certificationsScore, weight: '5%' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-[#0D0F12] border border-[#292D33] rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#F5F5F5]">{item.label}</span>
                      <span className="font-extrabold text-[#FFD166]">{item.score || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#08090B] rounded-full overflow-hidden border border-[#292D33]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (item.score || 0) >= 80 ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166]' : (item.score || 0) >= 60 ? 'bg-[#F5B83D]' : 'bg-[#B7791F]'
                        }`}
                        style={{ width: `${item.score || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#A7ADB7] font-semibold">
                      <span>Weight: {item.weight}</span>
                      <span>{(item.score || 0) >= 80 ? 'Strong' : (item.score || 0) >= 60 ? 'Moderate' : 'Low'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Keywords & Missing Keywords Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detected Keywords */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center justify-between border-b border-[#292D33] pb-3">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-[#4ADE80]" size={15} />
                  <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                    Detected Keywords ({atsAnalysis?.keywordAnalysis?.detectedKeywords?.length || parsed.skills?.length || 0})
                  </h4>
                </div>
                <Badge variant="success">Found</Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                {(atsAnalysis?.keywordAnalysis?.detectedKeywords || parsed.skills || []).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] rounded-lg text-xs font-semibold"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </Card>

            {/* Missing Industry Keywords */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center justify-between border-b border-[#292D33] pb-3">
                <div className="flex items-center gap-2">
                  <FaExclamationTriangle className="text-[#F87171]" size={15} />
                  <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                    Missing Target Keywords ({atsAnalysis?.missingKeywords?.length || 0})
                  </h4>
                </div>
                <Badge variant="danger">Recommended</Badge>
              </div>

              {atsAnalysis?.missingKeywords && atsAnalysis.missingKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                  {atsAnalysis.missingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-[#171A1F] border border-[#F87171]/30 text-[#F87171] rounded-lg text-xs font-semibold"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6F7682] pt-2">No critical missing keywords identified.</p>
              )}
            </Card>
          </div>

          {/* ATS Recommendations & Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ATS Recommendations */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                <FaLightbulb className="text-[#F5B83D]" size={16} />
                <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  ATS Optimization Recommendations
                </h4>
              </div>

              {atsAnalysis?.recommendations && atsAnalysis.recommendations.length > 0 ? (
                <ul className="space-y-2.5 text-xs text-[#A7ADB7]">
                  {atsAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 bg-[#0D0F12] p-2.5 rounded-xl border border-[#292D33]">
                      <span className="text-[#F5B83D] font-bold">•</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No active ATS recommendations.</p>
              )}
            </Card>

            {/* ATS Strengths */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                <FaCheckCircle className="text-[#4ADE80]" size={16} />
                <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Key Resume Strengths
                </h4>
              </div>

              {atsAnalysis?.strengths && atsAnalysis.strengths.length > 0 ? (
                <ul className="space-y-2.5 text-xs text-[#A7ADB7]">
                  {atsAnalysis.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2.5 bg-[#0D0F12] p-2.5 rounded-xl border border-[#292D33]">
                      <span className="text-[#4ADE80] font-bold">✓</span>
                      <span className="leading-relaxed">{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No strengths recorded.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: AI INSIGHTS & GEMINI ANALYSIS */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {!hasAi ? (
            <Card className="p-8 text-center space-y-4 bg-[#121519] border-[#292D33]">
              <FaRobot className="text-[#F5B83D] mx-auto" size={40} />
              <h3 className="text-base font-bold text-[#F5F5F5]">AI Analysis Not Yet Generated</h3>
              <p className="text-xs text-[#A7ADB7] max-w-md mx-auto">
                Generate in-depth recruiter feedback, career roadmap, and priority action recommendations powered by Google Gemini AI.
              </p>
              <Button
                variant="primary"
                disabled={retryingAi}
                icon={<FaMagic size={14} />}
                onClick={handleRetryAi}
              >
                {retryingAi ? 'Generating Insights...' : 'Generate Gemini AI Insights'}
              </Button>
            </Card>
          ) : (
            <>
              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Strengths */}
                <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
                  <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                    <FaCheckCircle className="text-[#4ADE80]" size={16} />
                    <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                      Identified Strengths
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-[#A7ADB7]">
                    {aiAnalysis.strengths?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#0D0F12] p-2.5 rounded-xl border border-[#292D33]">
                        <span className="text-[#4ADE80] font-bold shrink-0">✓</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* AI Weaknesses */}
                <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
                  <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                    <FaExclamationTriangle className="text-[#F5B83D]" size={16} />
                    <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                      Areas to Improve
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-[#A7ADB7]">
                    {aiAnalysis.weaknesses?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#0D0F12] p-2.5 rounded-xl border border-[#292D33]">
                        <span className="text-[#F5B83D] font-bold shrink-0">!</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Career Suggestions & Recruiter Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Career Suggestions */}
                <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
                  <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                    <FaBriefcase className="text-[#F5B83D]" size={16} />
                    <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                      Target Roles & Career Roadmap
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-[#A7ADB7]">
                    {aiAnalysis.careerSuggestions?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#171A1F] p-2.5 rounded-xl border border-[#F5B83D]/20">
                        <span className="text-[#FFD166] font-bold shrink-0">🎯</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Recruiter Feedback */}
                <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
                  <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                    <FaUser className="text-[#FFD166]" size={16} />
                    <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                      Executive Recruiter Feedback
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-[#A7ADB7]">
                    {aiAnalysis.recruiterFeedback?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#171A1F] p-2.5 rounded-xl border border-[#FFD166]/20">
                        <span className="text-[#FFD166] font-bold shrink-0">💬</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Priority Action Checklist */}
              {aiAnalysis.priorityActions && aiAnalysis.priorityActions.length > 0 && (
                <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
                  <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                    <FaAward className="text-[#F5B83D]" size={16} />
                    <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                      Priority Next Steps Checklist
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aiAnalysis.priorityActions.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 bg-[#0D0F12] rounded-xl border border-[#292D33] text-xs">
                        <span className="w-5 h-5 rounded-full bg-[#171A1F] text-[#FFD166] border border-[#F5B83D]/40 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[#A7ADB7] leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: PARSED RESUME DETAILS */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Skills Grid */}
          <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
            <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
              <FaCode className="text-[#F5B83D]" size={16} />
              <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                Extracted Skills Profile ({parsed.skills?.length || 0})
              </h4>
            </div>

            {parsed.technicalSkills && parsed.technicalSkills.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] text-[#FFD166] font-bold uppercase tracking-wider block">
                  Technical Stack ({parsed.technicalSkills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {parsed.technicalSkills.map((s, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] rounded-xl text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsed.softSkills && parsed.softSkills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#292D33]">
                <span className="text-[11px] text-[#F5B83D] font-bold uppercase tracking-wider block">
                  Soft Skills ({parsed.softSkills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {parsed.softSkills.map((s, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#171A1F] border border-[#FFD166]/25 text-[#FFD166] rounded-xl text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(!parsed.technicalSkills?.length && !parsed.softSkills?.length && parsed.skills?.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {parsed.skills.map((s, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] rounded-xl text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience */}
            <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                <FaBriefcase className="text-[#FFD166]" size={16} />
                <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Work Experience ({parsed.experience?.length || 0})
                </h4>
              </div>

              {parsed.experience && parsed.experience.length > 0 ? (
                <ul className="space-y-3.5 text-xs divide-y divide-[#292D33]">
                  {parsed.experience.map((exp, idx) => (
                    <li key={idx} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[#F5F5F5] font-bold">{exp.role || 'Role'}</p>
                          <p className="text-[#FFD166] font-medium">{exp.company}</p>
                        </div>
                        {exp.period && (
                          <span className="text-[10px] text-[#A7ADB7] bg-[#08090B] px-2 py-0.5 rounded border border-[#292D33]">
                            {exp.period}
                          </span>
                        )}
                      </div>
                      {exp.bulletPoints?.length > 0 && (
                        <ul className="list-disc list-inside space-y-0.5 text-[#A7ADB7] pl-1">
                          {exp.bulletPoints.slice(0, 3).map((bp, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">{bp}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No work experience identified.</p>
              )}
            </Card>

            {/* Education */}
            <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                <FaGraduationCap className="text-[#F5B83D]" size={16} />
                <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Education ({parsed.education?.length || 0})
                </h4>
              </div>

              {parsed.education && parsed.education.length > 0 ? (
                <ul className="space-y-3 text-xs">
                  {parsed.education.map((edu, idx) => (
                    <li key={idx} className="pt-2 border-t border-[#292D33] first:border-t-0 first:pt-0 space-y-0.5">
                      {typeof edu === 'object' && edu !== null ? (
                        <>
                          <p className="text-[#F5F5F5] font-bold">{edu.degree || edu.institution}</p>
                          {edu.degree && edu.institution && (
                            <p className="text-[#FFD166] font-medium">{edu.institution}</p>
                          )}
                          <div className="flex gap-3 text-[#A7ADB7] text-[11px]">
                            {edu.year && <span>📅 {edu.year}</span>}
                            {edu.grade && <span>🎯 {edu.grade}</span>}
                          </div>
                        </>
                      ) : (
                        <p className="text-[#A7ADB7]">{edu}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No education entries identified.</p>
              )}
            </Card>
          </div>

          {/* Projects, Certifications & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Projects */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                <FaFileAlt className="text-[#F5B83D]" size={14} />
                <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Projects ({parsed.projects?.length || 0})
                </h4>
              </div>
              {parsed.projects && parsed.projects.length > 0 ? (
                <ul className="space-y-3 text-xs">
                  {parsed.projects.map((p, idx) => (
                    <li key={idx} className="border-t border-[#292D33] pt-2 first:border-t-0 first:pt-0 space-y-1">
                      <p className="text-[#F5F5F5] font-bold">{p.title || p}</p>
                      {p.description && <p className="text-[#A7ADB7] leading-relaxed line-clamp-2">{p.description}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No project items found.</p>
              )}
            </Card>

            {/* Certifications */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                <FaCertificate className="text-[#F5B83D]" size={14} />
                <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Certifications ({parsed.certifications?.length || 0})
                </h4>
              </div>
              {parsed.certifications && parsed.certifications.length > 0 ? (
                <ul className="space-y-1 text-xs text-[#A7ADB7]">
                  {parsed.certifications.map((c, idx) => (
                    <li key={idx} className="truncate">• {c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No certifications recorded.</p>
              )}
            </Card>

            {/* Languages */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2 border-b border-[#292D33] pb-3">
                <FaLanguage className="text-[#FFD166]" size={15} />
                <h4 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Languages ({parsed.languages?.length || 0})
                </h4>
              </div>
              {parsed.languages && parsed.languages.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsed.languages.map((l, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-[#08090B] border border-[#292D33] text-[#F5F5F5] text-xs font-semibold rounded-lg">
                      {l}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6F7682]">No languages recorded.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS FOOTER BAR */}
      <Card className="p-6 border-[#292D33] bg-[#121519] print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-extrabold text-[#F5F5F5]">Next Quick Actions</h4>
            <p className="text-xs text-[#A7ADB7] mt-0.5">Explore specific optimization tools for this resume:</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link to={`/dashboard/report?id=${resume._id}`}>
              <Button size="sm" variant="outline" icon={<FaChartBar size={12} />}>
                View ATS Report
              </Button>
            </Link>

            <Link to={`/dashboard/ai-analysis?id=${resume._id}`}>
              <Button size="sm" variant="outline" icon={<FaRobot size={12} />}>
                View AI Insights
              </Button>
            </Link>

            <Link to={`/dashboard/job-match?id=${resume._id}`}>
              <Button size="sm" variant="outline" icon={<FaBriefcase size={12} />}>
                Job Match
              </Button>
            </Link>

            <Link to={`/dashboard/improve/${resume._id}`}>
              <Button size="sm" variant="outline" icon={<FaMagic size={12} />}>
                Improve Resume
              </Button>
            </Link>

            <Button size="sm" variant="primary" icon={<FaDownload size={12} />} onClick={handlePrint}>
              Download Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
