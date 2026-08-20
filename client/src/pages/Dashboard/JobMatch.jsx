import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaBriefcase, 
  FaBuilding, 
  FaFileAlt, 
  FaSearch, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaTrash, 
  FaSpinner, 
  FaChevronDown, 
  FaArrowLeft, 
  FaChartPie, 
  FaSync,
  FaEye,
  FaTasks
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { getResumes } from '../../services/resumeService';
import { 
  analyzeJobMatch, 
  getJobMatchHistory, 
  deleteJobMatch 
} from '../../services/jobMatchService';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function JobMatchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'history'

  // Input state
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Execution & Output state
  const [result, setResult] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch resumes list on mount
  useEffect(() => {
    const fetchUserResumes = async () => {
      try {
        setLoadingResumes(true);
        const res = await getResumes();
        const list = res.data || res || [];
        setResumes(Array.isArray(list) ? list : []);

        const params = new URLSearchParams(location.search);
        const queryId = params.get('id');

        if (queryId && list.some((r) => (r._id || r.id) === queryId)) {
          setSelectedResumeId(queryId);
        } else if (list.length > 0) {
          setSelectedResumeId(list[0]._id || list[0].id);
        }
      } catch (err) {
        showToast('Failed to load user resumes.', 'error');
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchUserResumes();
  }, [location.search]);

  // Fetch history when history tab is selected or search query changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryData();
    }
  }, [activeTab, searchQuery]);

  const fetchHistoryData = async () => {
    try {
      setLoadingHistory(true);
      const res = await getJobMatchHistory(searchQuery);
      const data = res.data || res || [];
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Failed to fetch job match history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRunAnalysis = async (e) => {
    if (e) e.preventDefault();

    if (!selectedResumeId) {
      showToast('Please select a resume file first.', 'warning');
      return;
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      showToast('Please paste a valid Job Description text (at least 20 characters).', 'warning');
      return;
    }

    try {
      setAnalyzing(true);
      const payload = {
        resumeId: selectedResumeId,
        jobTitle: jobTitle.trim() || 'Target Role',
        companyName: companyName.trim() || 'Target Company',
        jobDescription: jobDescription.trim(),
        force: true
      };

      const res = await analyzeJobMatch(payload);
      const data = res.data || res;
      setResult(data);
      showToast('Job Description match analysis generated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to compare job description.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteHistoryItem = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete analysis for '${title}'?`)) return;

    try {
      setDeletingId(id);
      await deleteJobMatch(id);
      setHistory((prev) => prev.filter((item) => item._id !== id));
      showToast('Job match report deleted.', 'success');
      if (result && result._id === id) setResult(null);
    } catch (err) {
      showToast('Failed to delete report.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewHistoryDetail = (item) => {
    setResult(item);
    setActiveTab('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const circleStrokeDash = 251.2;

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-[#4ADE80]';
    if (score >= 70) return 'text-[#FFD166]';
    return 'text-[#F5B83D]';
  };

  const getBadgeVariant = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'info';
    return 'warning';
  };

  const getHiringLabel = (score) => {
    if (score >= 85) return 'High Match / Interview Ready';
    if (score >= 70) return 'Moderate Fit';
    return 'Skill Gap Identified';
  };

  // Radar Chart Configuration
  const radarData = result
    ? {
        labels: [
          'Keyword Match',
          'Work Experience',
          'Education Fit',
          'Projects Match',
          'Certifications'
        ],
        datasets: [
          {
            label: 'Your Resume Alignment (%)',
            data: [
              result.matchScore || 0,
              result.experienceMatch || 0,
              result.educationMatch || 0,
              result.projectsMatch || 0,
              result.certificationMatch || 0
            ],
            backgroundColor: 'rgba(245, 184, 61, 0.2)',
            borderColor: '#F5B83D',
            borderWidth: 2,
            pointBackgroundColor: '#FFD166'
          },
          {
            label: 'Job Benchmark (100%)',
            data: [100, 100, 100, 100, 100],
            backgroundColor: 'rgba(255, 209, 102, 0.05)',
            borderColor: '#FFD166',
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointBackgroundColor: '#F5B83D'
          }
        ]
      }
    : null;

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(41, 45, 51, 0.6)' },
        grid: { color: 'rgba(41, 45, 51, 0.6)' },
        pointLabels: { color: '#A7ADB7', font: { size: 10, weight: 'bold' } },
        ticks: { backdropColor: 'transparent', color: '#6F7682', stepSize: 20 },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        labels: { color: '#F5F5F5', font: { size: 11, weight: 'bold' } }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292D33] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 text-[#A7ADB7] hover:text-[#F5F5F5] bg-[#0D0F12] border border-[#292D33] rounded-xl transition-all cursor-pointer"
            title="Back to Overview"
          >
            <FaArrowLeft size={12} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-wide">Job Description Matching</h1>
            <p className="text-[#A7ADB7] text-xs mt-1 font-semibold">
              Skill gap analysis & job description keyword comparison.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border border-[#292D33] rounded-xl p-1 bg-[#0D0F12] text-xs font-bold">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'analyze'
                ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166] text-[#08090B] font-bold shadow-md'
                : 'text-[#A7ADB7] hover:text-[#F5F5F5]'
            }`}
          >
            Analyze & Match
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166] text-[#08090B] font-bold shadow-md'
                : 'text-[#A7ADB7] hover:text-[#F5F5F5]'
            }`}
          >
            Saved Match History
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYZE & MATCH */}
      {activeTab === 'analyze' && (
        <div className="space-y-8">
          {/* Input Form Card */}
          <Card className="p-6 space-y-6 bg-[#121519] border-[#292D33]">
            <h2 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <FaBriefcase className="text-[#F5B83D]" size={16} />
              <span>Target Job & Resume Input</span>
            </h2>

            <form onSubmit={handleRunAnalysis} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Select Resume */}
                <div className="space-y-1.5">
                  <label className="text-[#A7ADB7] font-bold uppercase text-[10px] tracking-wider block">
                    Select Your Resume
                  </label>
                  {loadingResumes ? (
                    <div className="p-2.5 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#A7ADB7]">
                      Loading resumes...
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full appearance-none bg-[#0D0F12] border border-[#292D33] rounded-xl px-4 py-2.5 pr-10 font-semibold text-[#F5F5F5] focus:outline-none focus:border-[#F5B83D] cursor-pointer"
                      >
                        {resumes.map((r) => (
                          <option key={r._id || r.id} value={r._id || r.id}>
                            {r.originalName || r.fileName}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F7682] pointer-events-none" size={10} />
                    </div>
                  )}
                </div>

                {/* Job Title Input */}
                <div className="space-y-1.5">
                  <label className="text-[#A7ADB7] font-bold uppercase text-[10px] tracking-wider block">
                    Job Title (Optional)
                  </label>
                  <div className="relative">
                    <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F7682]" size={12} />
                    <input
                      type="text"
                      placeholder="e.g. Senior React Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D] font-semibold"
                    />
                  </div>
                </div>

                {/* Company Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[#A7ADB7] font-bold uppercase text-[10px] tracking-wider block">
                    Company Name (Optional)
                  </label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F7682]" size={12} />
                    <input
                      type="text"
                      placeholder="e.g. Google / Microsoft"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D] font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Job Description Textarea */}
              <div className="space-y-1.5 text-xs">
                <label className="text-[#A7ADB7] font-bold uppercase text-[10px] tracking-wider block">
                  Paste Job Description Requirements *
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste the full job posting text here (requirements, qualifications, technical stack, skills)..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full p-4 bg-[#0D0F12] border border-[#292D33] rounded-2xl text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D] font-medium leading-relaxed"
                />
              </div>

              <Button
                type="submit"
                disabled={analyzing || !selectedResumeId || !jobDescription.trim()}
                icon={analyzing ? <FaSpinner className="animate-spin" size={14} /> : <FaChartPie size={14} />}
                className="w-full py-3.5 font-extrabold text-sm tracking-wide"
              >
                {analyzing ? 'Analyzing Job Match & Skill Gap...' : 'Compare & Analyze Job Match'}
              </Button>
            </form>
          </Card>

          {/* Result Output Dashboard */}
          {analyzing ? (
            <Card className="p-12 text-center space-y-4 bg-[#121519] border-[#292D33]">
              <FaSpinner className="animate-spin text-[#F5B83D] mx-auto" size={32} />
              <h3 className="text-sm font-extrabold text-[#F5F5F5]">Comparing Candidate Resume Against Job Posting...</h3>
              <p className="text-xs text-[#A7ADB7] max-w-sm mx-auto">
                Extracting technical skills, experience rules, and evaluating keyword match percentages.
              </p>
            </Card>
          ) : result ? (
            <div className="space-y-8">
              {/* Overall Match % & Radar Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Circular Score Meter */}
                <Card className="flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden bg-[#121519] border-[#292D33]">
                  <span className="text-xs font-bold text-[#A7ADB7] uppercase tracking-widest mb-6">
                    Overall Job Match Score
                  </span>

                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <div className="absolute inset-2 bg-gradient-to-tr from-[#F5B83D]/10 to-[#FFD166]/10 rounded-full blur-[10px] pointer-events-none" />
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="matchGlow" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#F5B83D" />
                          <stop offset="100%" stopColor="#FFD166" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(41, 45, 51, 0.6)"
                        strokeWidth="7"
                        fill="none"
                      />
                      <motion.circle
                        initial={{ strokeDashoffset: circleStrokeDash }}
                        animate={{ strokeDashoffset: circleStrokeDash - (circleStrokeDash * (result.matchScore || 0)) / 100 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="url(#matchGlow)"
                        strokeWidth="7.5"
                        strokeDasharray={circleStrokeDash}
                        strokeLinecap="round"
                        fill="none"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-4xl font-black tracking-tight ${getScoreColor(result.matchScore)}`}>
                        {result.matchScore}%
                      </span>
                      <span className="text-[10px] text-[#A7ADB7] font-extrabold uppercase mt-0.5 tracking-widest">
                        Match Fit
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-1.5">
                    <Badge variant={getBadgeVariant(result.matchScore)}>
                      {getHiringLabel(result.matchScore)}
                    </Badge>
                    <p className="text-[10px] text-[#A7ADB7] font-semibold mt-1">
                      {result.jobTitle} &bull; {result.companyName}
                    </p>
                  </div>
                </Card>

                {/* Radar Chart */}
                <Card className="lg:col-span-2 p-6 flex flex-col justify-between h-[340px] bg-[#121519] border-[#292D33]">
                  <span className="text-xs font-bold text-[#A7ADB7] uppercase tracking-widest mb-2 block">
                    Category Match Alignment
                  </span>
                  <div className="h-[260px] w-full">
                    {radarData && <Radar data={radarData} options={radarOptions} />}
                  </div>
                </Card>
              </div>

              {/* Matched vs Missing Skills Badges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills */}
                <Card className="p-6 border border-[#292D33] bg-[#121519] space-y-4">
                  <h3 className="text-sm font-bold text-[#4ADE80] uppercase tracking-wider flex items-center gap-2">
                    <FaCheckCircle size={16} />
                    <span>Matched Skills & Keywords ({result.matchedKeywords?.length || 0})</span>
                  </h3>
                  {result.matchedKeywords && result.matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.matchedKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-[#171A1F] border border-[#4ADE80]/30 text-[#4ADE80] text-xs font-semibold rounded-xl">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#A7ADB7]">No explicit matching keywords detected.</p>
                  )}
                </Card>

                {/* Missing Skills */}
                <Card className="p-6 border border-[#292D33] bg-[#121519] space-y-4">
                  <h3 className="text-sm font-bold text-[#F87171] uppercase tracking-wider flex items-center gap-2">
                    <FaExclamationTriangle size={16} />
                    <span>Missing Job Requirements ({result.missingKeywords?.length || 0})</span>
                  </h3>
                  {result.missingKeywords && result.missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-[#171A1F] border border-[#F87171]/30 text-[#F87171] text-xs font-semibold rounded-xl">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#4ADE80] font-semibold">No critical missing keywords!</p>
                  )}
                </Card>
              </div>

              {/* Feedback & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
                  <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                    <FaCheckCircle className="text-[#4ADE80]" size={14} />
                    <span>Top Match Strengths</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#A7ADB7]">
                    {result.strengths && result.strengths.length > 0 ? (
                      result.strengths.map((s, i) => <li key={i}>&bull; {s}</li>)
                    ) : (
                      <p className="text-xs text-[#A7ADB7]">No specific strengths recorded.</p>
                    )}
                  </ul>
                </Card>

                {/* Recommendations */}
                <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
                  <h3 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                    <FaLightbulb className="text-[#F5B83D]" size={14} />
                    <span>Actionable Recommendations</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-[#A7ADB7]">
                    {result.recommendations && result.recommendations.length > 0 ? (
                      result.recommendations.map((r, i) => <li key={i}>&bull; {r}</li>)
                    ) : (
                      <p className="text-xs text-[#4ADE80] font-semibold">Candidate profile matches requirements!</p>
                    )}
                  </ul>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: SAVED MATCH HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Search Control */}
          <div className="relative max-w-sm w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F7682]" size={13} />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] placeholder-[#6F7682] focus:outline-none focus:border-[#F5B83D] text-xs"
            />
          </div>

          {/* History Table */}
          <Card className="overflow-hidden p-0 bg-[#121519] border-[#292D33]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0D0F12] border-b border-[#292D33] text-[10px] text-[#A7ADB7] font-extrabold uppercase tracking-widest">
                    <th className="px-6 py-4">Job Title & Company</th>
                    <th className="px-6 py-4">Match %</th>
                    <th className="px-6 py-4">Analysis Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#292D33]">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-[#A7ADB7] text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <FaSpinner className="animate-spin text-[#F5B83D]" size={16} />
                          <span>Loading match history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : history.length > 0 ? (
                    history.map((item) => (
                      <tr key={item._id} className="hover:bg-[#171A1F]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-xs font-bold text-[#F5F5F5] block">
                              {item.jobTitle}
                            </span>
                            <span className="text-[10px] text-[#A7ADB7] font-semibold">{item.companyName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getBadgeVariant(item.matchScore)}>
                            {item.matchScore}% Match
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#A7ADB7] font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewHistoryDetail(item)}
                              className="p-2 text-xs font-semibold rounded-lg text-[#F5B83D] hover:text-[#F5F5F5] hover:bg-[#F5B83D]/10 border border-[#F5B83D]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                              title="View Match Report"
                            >
                              <FaEye size={12} />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => handleDeleteHistoryItem(item._id, item.jobTitle)}
                              disabled={deletingId === item._id}
                              className="p-2 text-xs font-semibold rounded-lg text-[#F87171] hover:text-white hover:bg-[#F87171]/10 border border-[#F87171]/20 transition-all disabled:opacity-50 cursor-pointer"
                              title="Delete Record"
                            >
                              {deletingId === item._id ? (
                                <FaSpinner className="animate-spin" size={12} />
                              ) : (
                                <FaTrash size={12} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-[#A7ADB7] text-xs">
                        No saved job match reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
