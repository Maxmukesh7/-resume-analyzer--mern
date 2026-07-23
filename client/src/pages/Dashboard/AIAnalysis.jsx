import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaRobot, 
  FaMagic, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBrain, 
  FaTasks, 
  FaUserTie, 
  FaChartLine, 
  FaCopy, 
  FaDownload, 
  FaPrint, 
  FaSync, 
  FaChevronDown, 
  FaArrowLeft, 
  FaSpinner,
  FaEdit,
  FaPalette,
  FaLightbulb
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { getResumes } from '../../services/resumeService';
import { analyzeResumeWithAI, getAIAnalysisReport } from '../../services/aiService';

export default function AIAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const reportRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Load user resumes list on mount
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

  // Fetch stored AI report on resume selection change
  useEffect(() => {
    if (!selectedResumeId) return;

    const fetchAIReportData = async () => {
      try {
        setLoadingAnalysis(true);
        const res = await getAIAnalysisReport(selectedResumeId);
        const data = res.data || res;
        setAnalysis(data);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load AI analysis report.', 'error');
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAIReportData();
  }, [selectedResumeId]);

  const handleSelectResume = (id) => {
    setSelectedResumeId(id);
    navigate(`/dashboard/ai-analysis?id=${id}`);
  };

  const handleGenerateAgain = async () => {
    if (!selectedResumeId) return;
    try {
      setAnalyzing(true);
      showToast('Generating fresh Google Gemini AI insights...', 'info');
      const res = await analyzeResumeWithAI(selectedResumeId, true);
      const data = res.data || res;
      setAnalysis(data);
      showToast('AI analysis regenerated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate AI analysis.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!analysis) return;
    const textContent = `AI RESUME REVIEW SUMMARY:
${analysis.summary}

RATING: ${analysis.rating}

STRENGTHS:
${analysis.strengths?.map((s) => `- ${s}`).join('\n')}

PRIORITY ACTION ITEMS:
${analysis.priorityActions?.map((a) => `- ${a}`).join('\n')}

RECOMMENDATIONS:
${analysis.recommendations?.map((r) => `- ${r}`).join('\n')}`;

    navigator.clipboard.writeText(textContent);
    showToast('AI analysis report copied to clipboard!', 'success');
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      showToast('Generating PDF document...', 'info');
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      const opt = {
        margin: 0.3,
        filename: `AI_Resume_Analysis_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast('PDF generation failed. Printing window instead.', 'warning');
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getBadgeVariant = (rating) => {
    if (rating === 'Excellent') return 'success';
    if (rating === 'Very Good') return 'info';
    if (rating === 'Good') return 'indigo';
    return 'warning';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-xl transition-all"
            title="Back to Overview"
          >
            <FaArrowLeft size={12} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FaRobot className="text-purple-400" size={20} />
              <h1 className="text-2xl font-extrabold text-white tracking-wide">Google Gemini AI Resume Analysis</h1>
            </div>
            <p className="text-slate-450 text-xs mt-1 font-semibold">
              Deep intelligent evaluation, priority actions, & career growth insights.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {loadingResumes ? (
            <FaSpinner className="animate-spin text-blue-400" />
          ) : resumes.length > 0 ? (
            <div className="relative">
              <select
                value={selectedResumeId}
                onChange={(e) => handleSelectResume(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 pr-9 text-xs font-semibold text-slate-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
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
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={10} />
            </div>
          ) : null}

          <Button
            onClick={handleGenerateAgain}
            variant="outline"
            size="sm"
            disabled={analyzing || !selectedResumeId}
            icon={<FaSync className={analyzing ? 'animate-spin' : ''} size={12} />}
          >
            {analyzing ? 'Analyzing...' : 'Generate Again'}
          </Button>

          {analysis && (
            <>
              <Button
                onClick={handleCopyAnalysis}
                variant="outline"
                size="sm"
                icon={<FaCopy size={12} />}
              >
                Copy
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="secondary"
                size="sm"
                icon={<FaDownload size={12} />}
              >
                PDF
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                icon={<FaPrint size={12} />}
              >
                Print
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Analysis Body */}
      {loadingAnalysis || analyzing ? (
        <Card className="p-12 space-y-6 text-center border-purple-500/20 bg-slate-900/40">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-purple-600/20 rounded-full animate-ping" />
            <div className="p-4 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-full z-10">
              <FaRobot className="animate-bounce" size={32} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-white tracking-wide">
              Google Gemini AI is Evaluating Your Resume...
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Extracting candidate profile, cross-referencing ATS metrics, and generating personalized recommendations.
            </p>
          </div>
          {/* Skeleton Loaders */}
          <div className="space-y-3 max-w-xl mx-auto pt-4">
            <div className="h-4 bg-slate-800/60 rounded-full animate-pulse w-3/4 mx-auto" />
            <div className="h-4 bg-slate-800/60 rounded-full animate-pulse w-full" />
            <div className="h-4 bg-slate-800/60 rounded-full animate-pulse w-5/6 mx-auto" />
          </div>
        </Card>
      ) : !analysis ? (
        <Card className="p-12 text-center space-y-4">
          <FaExclamationTriangle className="text-amber-400 mx-auto" size={36} />
          <h3 className="text-lg font-bold text-white">No Resume Selected</h3>
          <p className="text-xs text-slate-450 max-w-md mx-auto">
            Please select or upload a resume to run the Google Gemini AI analysis.
          </p>
          <Button onClick={() => navigate('/dashboard/upload')}>Upload Resume First</Button>
        </Card>
      ) : (
        <div ref={reportRef} className="space-y-8 p-1">
          {/* Summary & Rating Card */}
          <Card className="p-8 relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl">
                  <FaMagic size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Executive Resume Summary</h2>
                  <p className="text-xs text-slate-450 font-semibold">AI Generated Executive Assessment</p>
                </div>
              </div>
              <Badge variant={getBadgeVariant(analysis.rating)} className="text-xs py-1 px-3">
                Overall AI Rating: {analysis.rating || 'Good'}
              </Badge>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {analysis.summary}
            </p>
          </Card>

          {/* Priority Action Items */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2.5">
              <FaTasks className="text-purple-400" size={16} />
              <span>Priority Action Items ({analysis.priorityActions?.length || 0})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.priorityActions && analysis.priorityActions.length > 0 ? (
                analysis.priorityActions.map((act, i) => (
                  <div key={i} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-200 font-semibold">
                    <span className="p-1 bg-purple-950/60 border border-purple-800/40 text-purple-400 rounded-md shrink-0">
                      {i + 1}
                    </span>
                    <span>{act}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No urgent priority actions listed.</p>
              )}
            </div>
          </Card>

          {/* Strengths & Weaknesses Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="p-6 border border-emerald-950/30 bg-slate-900/20 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <FaCheckCircle size={16} />
                <span>Verified Strengths ({analysis.strengths?.length || 0})</span>
              </h3>
              <ul className="space-y-3">
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  analysis.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No strengths highlighted.</p>
                )}
              </ul>
            </Card>

            {/* Weaknesses */}
            <Card className="p-6 border border-rose-950/30 bg-slate-900/20 space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <FaExclamationTriangle size={16} />
                <span>Areas for Growth ({analysis.weaknesses?.length || 0})</span>
              </h3>
              <ul className="space-y-3">
                {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                  analysis.weaknesses.map((weak, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                      <span>{weak}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-emerald-400 font-semibold">No major weak areas flagged!</p>
                )}
              </ul>
            </Card>
          </div>

          {/* Missing Skills Badge Pills */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FaBrain className="text-blue-400" size={16} />
              <span>Missing Technical & Soft Skills</span>
            </h3>
            {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {analysis.missingSkills.map((sk, i) => (
                  <Badge key={i} variant="slate" className="py-1 px-3 text-xs bg-slate-900 border-slate-800 text-blue-300 font-semibold">
                    + {sk}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-400 font-semibold">No critical missing skills detected!</p>
            )}
          </Card>

          {/* Recruiter Feedback & Career Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recruiter Feedback */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FaUserTie className="text-indigo-400" size={16} />
                <span>Recruiter Perspective & Insights</span>
              </h3>
              <ul className="space-y-3">
                {analysis.recruiterFeedback && analysis.recruiterFeedback.length > 0 ? (
                  analysis.recruiterFeedback.map((fb, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                      <span>{fb}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No recruiter notes available.</p>
                )}
              </ul>
            </Card>

            {/* Career Growth Suggestions */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FaChartLine className="text-teal-400" size={16} />
                <span>Career Advancement & Target Roles</span>
              </h3>
              <ul className="space-y-3">
                {analysis.careerSuggestions && analysis.careerSuggestions.length > 0 ? (
                  analysis.careerSuggestions.map((cs, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 shrink-0" />
                      <span>{cs}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No career suggestions listed.</p>
                )}
              </ul>
            </Card>
          </div>

          {/* Grammar & Formatting Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grammar */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <FaEdit className="text-amber-400" size={14} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Grammar & Style Polish
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.grammarSuggestions && analysis.grammarSuggestions.length > 0 ? (
                  analysis.grammarSuggestions.map((g, i) => (
                    <li key={i}>&bull; {g}</li>
                  ))
                ) : (
                  <p className="text-xs text-emerald-400 font-semibold">Writing style & grammar are clean!</p>
                )}
              </ul>
            </Card>

            {/* Formatting */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <FaPalette className="text-purple-400" size={14} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Formatting & Readability
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.formattingSuggestions && analysis.formattingSuggestions.length > 0 ? (
                  analysis.formattingSuggestions.map((f, i) => (
                    <li key={i}>&bull; {f}</li>
                  ))
                ) : (
                  <p className="text-xs text-emerald-400 font-semibold">Layout formatting is optimal!</p>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
