import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaDownload, 
  FaChevronDown, 
  FaArrowLeft,
  FaSpinner,
  FaSync,
  FaChartPie,
  FaAward
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Radar, Doughnut, Bar } from 'react-chartjs-2';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { getResumes, getResumeAnalysis, analyzeResume } from '../../services/resumeService';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function ATSReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Extract resume ID from URL query string ?id=XYZ
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
        showToast('Failed to load user resumes list.', 'error');
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchUserResumes();
  }, [location.search]);

  // Fetch ATS analysis whenever selected resume ID changes
  useEffect(() => {
    if (!selectedResumeId) return;

    const fetchAnalysisData = async () => {
      try {
        setLoadingAnalysis(true);
        const res = await getResumeAnalysis(selectedResumeId);
        const data = res.data || res;
        setAnalysis(data);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load ATS evaluation.', 'error');
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysisData();
  }, [selectedResumeId]);

  const handleSelectResume = (id) => {
    setSelectedResumeId(id);
    navigate(`/dashboard/report?id=${id}`);
  };

  const handleReanalyze = async () => {
    if (!selectedResumeId) return;
    try {
      setAnalyzing(true);
      const res = await analyzeResume(selectedResumeId, true);
      const data = res.data || res;
      setAnalysis(data);
      showToast('ATS Resume evaluation updated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to re-evaluate resume.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-[#F5B83D]';
    if (score >= 70) return 'text-[#FFD166]';
    return 'text-[#B7791F]';
  };

  const getBadgeVariant = (label) => {
    if (label === 'Excellent') return 'success';
    if (label === 'Very Good') return 'info';
    if (label === 'Good') return 'info';
    return 'warning';
  };

  const circleStrokeDash = 251.2;

  // Selected resume object
  const currentResume = resumes.find((r) => (r._id || r.id) === selectedResumeId);

  // Radar Chart Data Configuration
  const radarData = analysis
    ? {
        labels: [
          'Skills (20%)',
          'Experience (20%)',
          'Education (15%)',
          'Projects (10%)',
          'Structure (10%)',
          'Keywords (10%)',
          'Formatting (10%)',
          'Achievements (5%)',
          'Contact (5%)',
          'Certifications (5%)'
        ],
        datasets: [
          {
            label: 'Your Resume Score',
            data: [
              analysis.skillsScore || 0,
              analysis.experienceScore || 0,
              analysis.educationScore || 0,
              analysis.projectsScore || 0,
              analysis.structureScore || 0,
              analysis.keywordScore || 0,
              analysis.formattingScore || 0,
              analysis.achievementsScore || 0,
              analysis.contactScore || 0,
              analysis.certificationsScore || 0
            ],
            backgroundColor: 'rgba(245, 184, 61, 0.25)',
            borderColor: '#F5B83D',
            borderWidth: 2,
            pointBackgroundColor: '#FFD166',
            pointBorderColor: '#08090B'
          },
          {
            label: 'ATS Benchmark Target',
            data: [90, 85, 90, 85, 95, 90, 95, 80, 100, 80],
            backgroundColor: 'rgba(255, 209, 102, 0.1)',
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
        angleLines: { color: 'rgba(41, 45, 51, 0.7)' },
        grid: { color: 'rgba(41, 45, 51, 0.5)' },
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
      {/* Top Header & Dropdown Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#292D33] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 text-[#A7ADB7] hover:text-[#F5F5F5] bg-[#0D0F12] border border-[#292D33] rounded-xl transition-all cursor-pointer"
            title="Go to overview"
          >
            <FaArrowLeft size={12} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-wide">ATS Evaluation Dashboard</h1>
            <p className="text-[#A7ADB7] text-xs mt-1 font-semibold">
              Deterministic 0-100 ATS resume scoring & category breakdown.
            </p>
          </div>
        </div>

        {/* Dropdown Selector for User Resumes */}
        <div className="flex items-center gap-3">
          {loadingResumes ? (
            <FaSpinner className="animate-spin text-[#F5B83D]" />
          ) : resumes.length > 0 ? (
            <div className="relative">
              <select
                value={selectedResumeId}
                onChange={(e) => handleSelectResume(e.target.value)}
                className="appearance-none bg-[#0D0F12] border border-[#292D33] rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold text-[#F5F5F5] focus:outline-none focus:border-[#F5B83D] cursor-pointer"
              >
                {resumes.map((r) => {
                  const id = r._id || r.id;
                  const name = r.originalName || r.fileName || 'Resume';
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F7682] pointer-events-none" size={10} />
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/dashboard/upload')}>Upload Resume First</Button>
          )}

          <Button
            onClick={handleReanalyze}
            variant="outline"
            size="sm"
            disabled={analyzing || !selectedResumeId}
            icon={<FaSync className={analyzing ? 'animate-spin' : ''} size={12} />}
          >
            {analyzing ? 'Re-evaluating...' : 'Re-evaluate ATS'}
          </Button>
        </div>
      </div>

      {loadingAnalysis ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-[#A7ADB7]">
          <FaSpinner className="animate-spin text-[#F5B83D]" size={32} />
          <span className="text-xs font-semibold">Evaluating ATS scores and category metrics...</span>
        </div>
      ) : !analysis ? (
        <Card className="p-12 text-center space-y-4 bg-[#121519] border-[#292D33]">
          <FaExclamationTriangle className="text-[#F5B83D] mx-auto" size={36} />
          <h3 className="text-lg font-bold text-[#F5F5F5]">No Resumes Uploaded Yet</h3>
          <p className="text-xs text-[#A7ADB7] max-w-md mx-auto">
            Please upload a resume to run the automated ATS evaluation engine and view scores.
          </p>
          <Button onClick={() => navigate('/dashboard/upload')}>Upload Resume Now</Button>
        </Card>
      ) : (
        <>
          {/* Main Score & Metrics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Circular Score Meter Card */}
            <Card className="flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden bg-[#121519] border-[#292D33]">
              <span className="text-xs font-bold text-[#A7ADB7] uppercase tracking-widest mb-6">
                Overall ATS Score
              </span>

              <div className="relative w-44 h-44 flex items-center justify-center">
                <div className="absolute inset-2 bg-gradient-to-tr from-[#F5B83D]/10 to-[#FFD166]/10 rounded-full blur-[10px] pointer-events-none" />
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="scoreGlow" x1="0" y1="0" x2="1" y2="1">
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
                    animate={{ strokeDashoffset: circleStrokeDash - (circleStrokeDash * (analysis.overallScore || 0)) / 100 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#scoreGlow)"
                    strokeWidth="7.5"
                    strokeDasharray={circleStrokeDash}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black tracking-tight ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.overallScore || 0}
                  </span>
                  <span className="text-[10px] text-[#A7ADB7] font-extrabold uppercase mt-0.5 tracking-widest">
                    Out of 100
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-1.5">
                <Badge variant={getBadgeVariant(analysis.ratingLabel)}>
                  Rating: {analysis.ratingLabel || 'Needs Improvement'}
                </Badge>
                <p className="text-[10px] text-[#A7ADB7] font-semibold mt-1">
                  Evaluated on {new Date(analysis.generatedAt || analysis.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>

            {/* Radar Chart Card */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between h-[340px] bg-[#121519] border-[#292D33]">
              <span className="text-xs font-bold text-[#A7ADB7] uppercase tracking-widest mb-2 block">
                Category Radar Comparison
              </span>
              <div className="h-[260px] w-full">
                {radarData && <Radar data={radarData} options={radarOptions} />}
              </div>
            </Card>
          </div>

          {/* 10 Category Breakdown Progress Bars Grid */}
          <Card className="p-8 space-y-6 bg-[#121519] border-[#292D33]">
            <h3 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <FaChartPie className="text-[#F5B83D]" size={16} />
              <span>Category Score Breakdowns (10 Categories)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Technical Skills (20%)', score: analysis.skillsScore },
                { label: 'Work Experience (20%)', score: analysis.experienceScore },
                { label: 'Education Credentials (15%)', score: analysis.educationScore },
                { label: 'Projects Portfolio (10%)', score: analysis.projectsScore },
                { label: 'Resume Structure (10%)', score: analysis.structureScore },
                { label: 'Keyword Quality (10%)', score: analysis.keywordScore },
                { label: 'Formatting & Layout (10%)', score: analysis.formattingScore },
                { label: 'Achievements & Metrics (5%)', score: analysis.achievementsScore },
                { label: 'Certifications (5%)', score: analysis.certificationsScore },
                { label: 'Contact Information (5%)', score: analysis.contactScore }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#F5F5F5]">{item.label}</span>
                    <span className="text-[#F5B83D] font-bold">{item.score || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0D0F12] rounded-full overflow-hidden border border-[#292D33]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score || 0}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.05 }}
                      className="h-full bg-gradient-to-r from-[#F5B83D] to-[#FFD166] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Missing Keywords & Missing Sections Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Keywords */}
            <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-[#FFD166] rounded-full" />
                <span>Missing High-Impact Keywords</span>
              </h3>
              {analysis.missingKeywords && analysis.missingKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((kw, i) => (
                    <Badge key={i} variant="slate" className="py-1 px-3 text-xs bg-[#0D0F12] border-[#292D33] text-[#FFD166] font-semibold">
                      + {kw}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#4ADE80] font-semibold">No critical missing keywords detected!</p>
              )}
            </Card>

            {/* Missing Sections */}
            <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-[#F5B83D] rounded-full" />
                <span>Missing Resume Sections</span>
              </h3>
              {analysis.missingSections && analysis.missingSections.length > 0 ? (
                <ul className="space-y-2 text-xs text-rose-400 font-semibold">
                  {analysis.missingSections.map((sec, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <FaExclamationTriangle size={12} />
                      <span>{sec} section is missing</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#4ADE80] font-semibold">All essential resume sections are present!</p>
              )}
            </Card>
          </div>

          {/* Strengths & Weaknesses Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="p-6 border border-[#292D33] bg-[#121519] space-y-4">
              <h3 className="text-sm font-bold text-[#4ADE80] uppercase tracking-wider flex items-center gap-2">
                <FaCheckCircle size={16} />
                <span>Resume Strengths ({analysis.strengths?.length || 0})</span>
              </h3>
              <ul className="space-y-3">
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  analysis.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-[#A7ADB7] font-medium">
                      <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-[#A7ADB7]">No major strengths highlighted.</p>
                )}
              </ul>
            </Card>

            {/* Weaknesses */}
            <Card className="p-6 border border-[#292D33] bg-[#121519] space-y-4">
              <h3 className="text-sm font-bold text-[#F5B83D] uppercase tracking-wider flex items-center gap-2">
                <FaExclamationTriangle size={16} />
                <span>Optimization Risks ({analysis.weaknesses?.length || 0})</span>
              </h3>
              <ul className="space-y-3">
                {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                  analysis.weaknesses.map((weak, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-[#A7ADB7] font-medium">
                      <span className="w-1.5 h-1.5 bg-[#F5B83D] rounded-full mt-1.5 shrink-0" />
                      <span>{weak}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-[#4ADE80] font-semibold">No major optimization risks found!</p>
                )}
              </ul>
            </Card>
          </div>

          {/* Actionable Recommendations Checklist */}
          <Card className="p-8 space-y-4 bg-[#121519] border-[#292D33]">
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <FaLightbulb className="text-[#FFD166]" size={16} />
              <span>Actionable Recommendations ({analysis.recommendations?.length || 0})</span>
            </h3>
            <ol className="space-y-3 list-decimal pl-5">
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-[#A7ADB7] font-semibold pl-1">
                    {rec}
                  </li>
                ))
              ) : (
                <p className="text-xs text-[#4ADE80] font-semibold">Your resume is already optimized for ATS screening!</p>
              )}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
