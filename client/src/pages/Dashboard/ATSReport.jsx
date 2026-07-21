import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaRegLightbulb, 
  FaDownload, 
  FaChevronDown, 
  FaArrowLeft 
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { mockAtsReports } from '../../utils/mockData';

export default function ATSReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedReportId, setSelectedReportId] = useState('res-001');

  // Extract resume ID from query params e.g. ?id=res-001
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && mockAtsReports[id]) {
      setSelectedReportId(id);
    }
  }, [location]);

  const report = mockAtsReports[selectedReportId] || mockAtsReports['res-001'];

  const handleDownload = () => {
    showToast('Preparing PDF download document...', 'info');
    setTimeout(() => {
      showToast('ATS Report downloaded successfully!', 'success');
    }, 1500);
  };

  const handleSelectReport = (id) => {
    setSelectedReportId(id);
    navigate(`/dashboard/report?id=${id}`);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    return 'text-amber-450';
  };

  const circleStrokeDash = 251.2; // 2 * pi * r (r = 40)

  return (
    <div className="space-y-8">
      {/* Top Navigation & Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800/80 rounded-xl transition-all"
            title="Go to overview"
          >
            <FaArrowLeft size={12} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">ATS Diagnostic Report</h1>
            <p className="text-slate-450 text-xs mt-1 font-semibold">
              Deep inspection analysis for <span className="text-slate-200">{report.name}</span>
            </p>
          </div>
        </div>

        {/* Dropdown Selector for uploaded resumes */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedReportId}
              onChange={(e) => handleSelectReport(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold text-slate-350 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {Object.values(mockAtsReports).map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.overallScore}%)
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
          </div>

          <Button
            onClick={handleDownload}
            icon={<FaDownload size={12} />}
            variant="outline"
            size="sm"
          >
            Download Report
          </Button>
        </div>
      </div>

      {/* Main Score & Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Circular Score Chart */}
        <Card className="flex flex-col items-center justify-center p-8 text-center h-full">
          <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-6">
            Overall ATS Score
          </span>
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Glowing background arc effect */}
            <div className="absolute inset-2 bg-gradient-to-tr from-blue-600/10 to-purple-600/10 rounded-full blur-[10px] pointer-events-none" />
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="scoreGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              {/* Gray Base Circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(30, 41, 59, 0.4)"
                strokeWidth="7"
                fill="none"
              />
              {/* Progress Arc */}
              <motion.circle
                initial={{ strokeDashoffset: circleStrokeDash }}
                animate={{ strokeDashoffset: circleStrokeDash - (circleStrokeDash * report.overallScore) / 100 }}
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
              <span className={`text-4xl font-black tracking-tight ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase mt-0.5 tracking-widest">
                Score
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-1">
            <Badge variant={report.overallScore >= 85 ? 'success' : report.overallScore >= 70 ? 'info' : 'warning'}>
              {report.overallScore >= 85 ? 'Highly Optimized' : report.overallScore >= 70 ? 'Good Fit' : 'Action Required'}
            </Badge>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Scanned and verified on {report.uploadDate}</p>
          </div>
        </Card>

        {/* Sub-Metric progress meters */}
        <Card className="lg:col-span-2 p-8 h-full flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-455 uppercase tracking-wider mb-6 block">
            Parameter Diagnostic Breakdowns
          </span>
          <div className="space-y-5">
            {Object.entries(report.metrics).map(([key, val], idx) => {
              const labelMap = {
                keywordMatch: 'Keyword Density Match',
                skillsMatch: 'Technical Skill Match',
                formattingScore: 'Parsing Layout Formatting',
                experienceScore: 'Role/Experience Scope',
                educationScore: 'Academic Credentials Fit'
              };
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{labelMap[key]}</span>
                    <span className="text-blue-400">{val}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.35)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Missing Keywords Badges */}
      <Card className="p-8">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="inline-block w-1.5 h-3.5 bg-purple-500 rounded-full" />
          <span>Missing Targeted Keywords</span>
        </h3>
        <p className="text-xs text-slate-450 font-semibold leading-relaxed mb-6">
          The following keywords were found missing relative to industry profiles. Inject these into your descriptions.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {report.missingKeywords.map((kw, i) => (
            <Badge key={i} variant="slate" className="py-1 px-3 text-xs bg-slate-900 border-slate-800 text-slate-300 font-bold">
              + {kw}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Strengths & Weaknesses Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="p-8 border border-emerald-950/20 bg-slate-900/10">
          <h3 className="text-sm font-bold text-emerald-400 mb-5 flex items-center gap-2.5 uppercase tracking-wider">
            <FaCheckCircle size={16} />
            <span>Parsing Strengths</span>
          </h3>
          <ul className="space-y-4">
            {report.strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-3.5 text-xs text-slate-350 leading-relaxed font-semibold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Weaknesses */}
        <Card className="p-8 border border-rose-950/20 bg-slate-900/10">
          <h3 className="text-sm font-bold text-amber-450 mb-5 flex items-center gap-2.5 uppercase tracking-wider">
            <FaExclamationTriangle size={16} />
            <span>Optimization Risks</span>
          </h3>
          <ul className="space-y-4">
            {report.weaknesses.map((weak, i) => (
              <li key={i} className="flex items-start gap-3.5 text-xs text-slate-350 leading-relaxed font-semibold">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Feedback Suggestions Accordions/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recruiter Suggestions */}
        <Card className="p-8">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2.5 uppercase tracking-wider">
            <FaLightbulb className="text-blue-400" size={16} />
            <span>Recruiter Recommendations</span>
          </h3>
          <ol className="space-y-4 list-decimal pl-4">
            {report.recruiterSuggestions.map((sug, i) => (
              <li key={i} className="text-xs text-slate-350 leading-relaxed font-semibold pl-1.5">
                {sug}
              </li>
            ))}
          </ol>
        </Card>

        {/* AI Action Steps */}
        <Card className="p-8">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2.5 uppercase tracking-wider">
            <FaRegLightbulb className="text-purple-400" size={16} />
            <span>AI Automated Steps</span>
          </h3>
          <ul className="space-y-4">
            {report.aiSuggestions.map((sug, i) => (
              <li key={i} className="flex items-start gap-3.5 text-xs text-slate-350 leading-relaxed font-semibold">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0" />
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
