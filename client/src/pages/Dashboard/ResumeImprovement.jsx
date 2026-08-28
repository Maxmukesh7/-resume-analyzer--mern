import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import {
  FaMagic,
  FaCopy,
  FaSync,
  FaCheck,
  FaFilePdf,
  FaFileAlt,
  FaGraduationCap,
  FaBriefcase,
  FaCode,
  FaCloud,
  FaTools,
  FaLightbulb,
  FaChevronDown,
  FaSpinner,
  FaLayerGroup
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { getResumes } from '../../services/resumeService';
import {
  improveFullResume,
  getResumeImprovements,
  rewriteSummary
} from '../../services/aiService';

// Custom typing animation component for AI text generation
function TypingText({ text = '', speed = 12, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    if (!text) {
      setIsTyping(false);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="relative font-mono leading-relaxed text-slate-200">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
      )}
    </span>
  );
}

// Skeleton component for loading state
function SkeletonCard() {
  return (
    <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl animate-pulse space-y-4">
      <div className="h-6 bg-slate-800 rounded-md w-1/3" />
      <div className="h-4 bg-slate-800/60 rounded-md w-3/4" />
      <div className="h-4 bg-slate-800/60 rounded-md w-full" />
      <div className="h-4 bg-slate-800/60 rounded-md w-5/6" />
      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="h-20 bg-slate-800/40 rounded-xl" />
        <div className="h-20 bg-slate-800/40 rounded-xl" />
      </div>
    </div>
  );
}

export default function ResumeImprovement() {
  const location = useLocation();
  const { id: urlResumeId } = useParams();
  const { showToast } = useToast();
  const pdfExportRef = useRef(null);

  // Resume selection & state
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedResume, setSelectedResume] = useState(null);
  
  // Options & Inputs
  const [experienceLevel, setExperienceLevel] = useState('Experienced');
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const [industry, setIndustry] = useState('Software Engineering');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'experience' | 'projects' | 'skills' | 'notes'

  // Data & Loading States
  const [improvementData, setImprovementData] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingImprovement, setLoadingImprovement] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);

  // Standalone section rewriters states
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Fetch list of user resumes
  useEffect(() => {
    const fetchUserResumes = async () => {
      try {
        setLoadingResumes(true);
        const res = await getResumes();
        const list = res.data || res || [];
        setResumes(Array.isArray(list) ? list : []);

        const params = new URLSearchParams(location.search);
        const queryId = params.get('id') || urlResumeId;

        if (queryId && list.some((r) => (r._id || r.id) === queryId)) {
          setSelectedResumeId(queryId);
        } else if (list.length > 0) {
          setSelectedResumeId(list[0]._id || list[0].id);
        }
      } catch (err) {
        showToast('Failed to load your resumes list.', 'error');
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchUserResumes();
  }, [location.search, urlResumeId]);

  // Update selected resume object
  useEffect(() => {
    if (!selectedResumeId) return;
    const found = resumes.find((r) => (r._id || r.id) === selectedResumeId);
    setSelectedResume(found || null);

    // Fetch existing saved improvements
    const fetchImprovements = async () => {
      try {
        setLoadingImprovement(true);
        const res = await getResumeImprovements(selectedResumeId);
        const data = res.data || res;
        if (data && data.improvedSummary) {
          setImprovementData(data);
        } else {
          setImprovementData(null);
        }
      } catch (err) {
        setImprovementData(null);
      } finally {
        setLoadingImprovement(false);
      }
    };

    fetchImprovements();
  }, [selectedResumeId, resumes]);

  // Handle Generate / Regenerate AI Improvements
  const handleGenerateImprovements = async (force = false) => {
    if (!selectedResumeId) {
      showToast('Please select a resume to improve.', 'warning');
      return;
    }

    try {
      setGenerating(true);
      showToast(force ? 'Regenerating AI improvements...' : 'Analyzing resume and building AI suggestions...', 'info');

      const res = await improveFullResume(selectedResumeId, {
        experienceLevel,
        targetJobDescription,
        industry,
        force
      });

      const data = res.data || res;
      setImprovementData(data);
      showToast('AI Resume Improvements generated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate AI improvements.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Copy helper
  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    showToast(`Copied ${label} to clipboard!`, 'success');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Download TXT
  const handleDownloadTxt = () => {
    if (!improvementData) return;

    const original = selectedResume?.parsedData || {};
    const imp = improvementData;

    let content = `==================================================\n`;
    content += `AI IMPROVED RESUME REPORT\n`;
    content += `Candidate: ${original.fullName || 'Candidate'}\n`;
    content += `Generated Date: ${new Date().toLocaleDateString()}\n`;
    content += `==================================================\n\n`;

    content += `1. PROFESSIONAL SUMMARY\n`;
    content += `--------------------------------------------------\n`;
    content += `${imp.improvedSummary}\n\n`;

    content += `2. WORK EXPERIENCE\n`;
    content += `--------------------------------------------------\n`;
    (imp.improvedExperience || []).forEach((exp, i) => {
      content += `[${i + 1}] ${exp.role} at ${exp.company} (${exp.period || 'N/A'})\n`;
      (exp.bulletPoints || []).forEach((bp) => {
        content += `  • ${bp}\n`;
      });
      content += `\n`;
    });

    content += `3. KEY PROJECTS\n`;
    content += `--------------------------------------------------\n`;
    (imp.improvedProjects || []).forEach((proj, i) => {
      content += `[${i + 1}] ${proj.title}\n`;
      if (proj.technologies?.length) {
        content += `  Tech Stack: ${proj.technologies.join(', ')}\n`;
      }
      (proj.bulletPoints || []).forEach((bp) => {
        content += `  • ${bp}\n`;
      });
      content += `\n`;
    });

    content += `4. RECOMMENDED SKILLS\n`;
    content += `--------------------------------------------------\n`;
    const rec = imp.recommendedSkills || {};
    content += `Technical Skills: ${(rec.technicalSkills || []).join(', ')}\n`;
    content += `Soft Skills: ${(rec.softSkills || []).join(', ')}\n`;
    content += `Frameworks: ${(rec.frameworks || []).join(', ')}\n`;
    content += `Cloud Technologies: ${(rec.cloudTechnologies || []).join(', ')}\n`;
    content += `DevOps Tools: ${(rec.devOpsTools || []).join(', ')}\n\n`;

    content += `5. AI OPTIMIZATION NOTES\n`;
    content += `--------------------------------------------------\n`;
    (imp.optimizationNotes || []).forEach((note) => {
      content += `• ${note}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${original.fullName || 'Resume'}_Improved_Suggestions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Downloaded TXT summary successfully!', 'success');
  };

  // Download PDF
  const handleDownloadPdf = () => {
    if (!pdfExportRef.current || !improvementData) return;

    const opt = {
      margin: 0.4,
      filename: `${selectedResume?.parsedData?.fullName || 'Resume'}_Improved_Suggestions.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    showToast('Generating PDF document...', 'info');
    html2pdf().set(opt).from(pdfExportRef.current).save().then(() => {
      showToast('PDF downloaded successfully!', 'success');
    }).catch(() => {
      showToast('Failed to generate PDF.', 'error');
    });
  };

  // Single Section Rewrite: Summary
  const handleRewriteSummaryOnly = async () => {
    try {
      setRewriteLoading(true);
      const original = selectedResume?.parsedData || {};
      const res = await rewriteSummary({
        currentSummary: original.summary || '',
        experienceLevel,
        targetRole: industry,
        skills: original.skills || []
      });

      const data = res.data || res;
      if (data.improvedSummary) {
        setImprovementData((prev) => ({
          ...(prev || {}),
          improvedSummary: data.improvedSummary
        }));
        showToast('Professional summary rewritten!', 'success');
      }
    } catch (err) {
      showToast('Failed to rewrite summary.', 'error');
    } finally {
      setRewriteLoading(false);
    }
  };

  const originalData = selectedResume?.parsedData || {};

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-[#121519] via-[#121519] to-[#171A1F] border border-[#292D33] shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5B83D]/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#FFD166]/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B83D]/10 border border-[#F5B83D]/25 text-[#FFD166] text-xs font-semibold uppercase tracking-wider">
              <FaMagic size={12} className="animate-spin-slow" /> Phase 12 Engine
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              AI Resume <span className="bg-gradient-to-r from-[#F5B83D] via-[#FFD166] to-[#F5B83D] bg-clip-text text-transparent">Rewriter & Optimizer</span>
            </h1>
            <p className="text-[#A7ADB7] text-sm max-w-2xl leading-relaxed">
              Transform your raw resume into a polished, high-impact, ATS-optimized portfolio using Google Gemini AI. Compare original vs. improved versions side-by-side with real-time diff metrics.
            </p>
          </div>

          {/* Resume Selector Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[240px]">
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                disabled={loadingResumes || generating}
                className="w-full pl-4 pr-10 py-3 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] text-sm font-medium focus:outline-none focus:border-[#F5B83D] focus:ring-1 focus:ring-[#F5B83D] transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                {resumes.length === 0 ? (
                  <option value="">No Resumes Found</option>
                ) : (
                  resumes.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.originalName || r.fileName || 'Untitled Resume'}
                    </option>
                  ))
                )}
              </select>
              <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F7682] pointer-events-none" size={12} />
            </div>

            <Button
              onClick={() => handleGenerateImprovements(false)}
              disabled={generating || !selectedResumeId}
              className="bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#e5a82d] hover:to-[#f0c256] text-[#08090B] font-bold shadow-lg shadow-[#F5B83D]/25 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            >
              {generating ? (
                <>
                  <FaSpinner size={16} className="animate-spin" />
                  <span>Optimizing with AI...</span>
                </>
              ) : (
                <>
                  <FaMagic size={16} />
                  <span>{improvementData ? 'Regenerate Improvements' : 'Improve Resume'}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="mt-8 pt-6 border-t border-[#292D33] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A7ADB7] uppercase tracking-wider mb-2">
              Experience Level
            </label>
            <div className="flex bg-[#0D0F12] p-1 rounded-xl border border-[#292D33]">
              <button
                type="button"
                onClick={() => setExperienceLevel('Fresher')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  experienceLevel === 'Fresher'
                    ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166] text-[#08090B] font-bold shadow-md'
                    : 'text-[#A7ADB7] hover:text-[#F5F5F5]'
                }`}
              >
                <FaGraduationCap size={12} /> Fresher / Entry
              </button>
              <button
                type="button"
                onClick={() => setExperienceLevel('Experienced')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  experienceLevel === 'Experienced'
                    ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166] text-[#08090B] font-bold shadow-md'
                    : 'text-[#A7ADB7] hover:text-[#F5F5F5]'
                }`}
              >
                <FaBriefcase size={12} /> Experienced
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7ADB7] uppercase tracking-wider mb-2">
              Target Industry / Role
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Full Stack Developer, DevOps Engineer"
              className="w-full px-3.5 py-2 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] text-xs font-medium focus:outline-none focus:border-[#F5B83D] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7ADB7] uppercase tracking-wider mb-2">
              Target Job Description (Optional)
            </label>
            <input
              type="text"
              value={targetJobDescription}
              onChange={(e) => setTargetJobDescription(e.target.value)}
              placeholder="Paste Job Description snippet..."
              className="w-full px-3.5 py-2 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#F5F5F5] text-xs font-medium focus:outline-none focus:border-[#F5B83D] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loadingImprovement || loadingResumes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !improvementData ? (
        <Card className="p-12 text-center bg-[#121519] backdrop-blur-xl border border-[#292D33] rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F5B83D]/10 border border-[#F5B83D]/25 flex items-center justify-center text-[#F5B83D]">
            <FaMagic size={28} />
          </div>
          <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">No AI Improvements Generated Yet</h3>
          <p className="text-[#A7ADB7] text-sm max-w-md mx-auto mb-6">
            Click <span className="text-[#FFD166] font-semibold">"Improve Resume"</span> above to trigger Google Gemini AI re-writing, bullet point enhancement, and ATS skill recommendations.
          </p>
          <Button
            onClick={() => handleGenerateImprovements(false)}
            disabled={generating || !selectedResumeId}
            className="bg-gradient-to-r from-[#F5B83D] to-[#FFD166] text-[#08090B] font-bold px-8 py-3 rounded-xl shadow-lg shadow-[#F5B83D]/30"
          >
            Start AI Resume Improvement
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar & Export Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121519] backdrop-blur-xl border border-[#292D33] rounded-2xl">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'summary', label: 'Summary', icon: <FaFileAlt size={14} /> },
                { id: 'experience', label: 'Experience', icon: <FaBriefcase size={14} /> },
                { id: 'projects', label: 'Projects', icon: <FaCode size={14} /> },
                { id: 'skills', label: 'Recommended Skills', icon: <FaTools size={14} /> },
                { id: 'notes', label: 'AI Notes', icon: <FaLightbulb size={14} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#F5B83D] to-[#FFD166] text-[#08090B] font-bold shadow-md shadow-[#F5B83D]/20 border border-[#FFD166]/30'
                      : 'text-[#A7ADB7] hover:text-[#F5F5F5] bg-[#0D0F12] border border-[#292D33]'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleGenerateImprovements(true)}
                disabled={generating}
                className="bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] border border-[#292D33] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FaSync size={12} className={generating ? 'animate-spin' : ''} /> Regenerate
              </Button>

              <Button
                onClick={handleDownloadTxt}
                className="bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] border border-[#292D33] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FaFileAlt size={12} /> TXT
              </Button>

              <Button
                onClick={handleDownloadPdf}
                className="bg-[#121519] hover:bg-[#171A1F] text-[#F5B83D] border border-[#F5B83D]/40 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FaFilePdf size={12} /> PDF Download
              </Button>
            </div>
          </div>

          {/* Side-by-Side Comparison Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT PANEL: Original Resume Content */}
            <div className="p-6 bg-[#121519] backdrop-blur-xl border border-[#292D33] rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#292D33]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <FaFileAlt size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5]">Original Content</h3>
                    <p className="text-[#A7ADB7] text-xs">Unmodified parsed resume data</p>
                  </div>
                </div>
                <Badge variant="warning" className="text-xs uppercase font-semibold">Before</Badge>
              </div>

              {activeTab === 'summary' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A7ADB7]">Professional Summary</h4>
                  <div className="p-4 bg-[#0D0F12] border border-[#292D33] rounded-2xl text-[#F5F5F5] text-sm leading-relaxed min-h-[140px]">
                    {(() => {
                      const sum = (originalData.summary || improvementData?.originalResume?.summary || '').trim();
                      return sum.length > 0 ? (
                        sum
                      ) : (
                        <p className="text-[#A7ADB7] text-xs italic">No professional summary found in the uploaded resume.</p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A7ADB7]">Work Experience Entries</h4>
                  {(() => {
                    const expList = originalData.experience?.length
                      ? originalData.experience
                      : improvementData?.originalResume?.experience || [];
                    if (!expList || expList.length === 0) {
                      return <p className="text-[#A7ADB7] text-xs italic">No experience entries found in uploaded resume.</p>;
                    }
                    return expList.map((exp, idx) => (
                      <div key={idx} className="p-4 bg-[#0D0F12] border border-[#292D33] rounded-2xl space-y-2">
                        {typeof exp === 'object' && exp !== null ? (
                          <>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-[#F5F5F5] text-sm block">{exp.role || 'Role'}</span>
                                <span className="text-xs text-[#FFD166] font-medium">{exp.company}</span>
                              </div>
                              {exp.period && (
                                <span className="text-xs text-[#A7ADB7] bg-[#08090B] px-2 py-0.5 rounded-lg border border-[#292D33] whitespace-nowrap">
                                  {exp.period}
                                </span>
                              )}
                            </div>
                            {(exp.bulletPoints?.length > 0 || exp.description) && (
                              <ul className="list-disc list-inside text-[#A7ADB7] text-xs space-y-1 pt-1">
                                {(exp.bulletPoints?.length > 0 ? exp.bulletPoints : [exp.description]).map((bp, bIdx) => (
                                  <li key={bIdx} className="leading-relaxed">{bp}</li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <p className="text-[#A7ADB7] text-xs">{exp}</p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A7ADB7]">Key Projects</h4>
                  {(() => {
                    const projList = originalData.projects?.length
                      ? originalData.projects
                      : improvementData?.originalResume?.projects || [];
                    if (!projList || projList.length === 0) {
                      return <p className="text-[#A7ADB7] text-xs italic">No project entries found in uploaded resume.</p>;
                    }
                    return projList.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-[#0D0F12] border border-[#292D33] rounded-2xl space-y-2">
                        {typeof proj === 'object' && proj !== null ? (
                          <>
                            <h5 className="font-bold text-[#F5F5F5] text-sm">{proj.title || 'Project'}</h5>
                            {proj.description && <p className="text-xs text-[#A7ADB7]">{proj.description}</p>}
                            {proj.technologies?.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {proj.technologies.map((t, tIdx) => (
                                  <span key={tIdx} className="px-2 py-0.5 rounded-md bg-[#08090B] text-[#A7ADB7] text-[10px]">{t}</span>
                                ))}
                              </div>
                            )}
                            {proj.bulletPoints?.length > 0 && (
                              <ul className="list-disc list-inside text-[#A7ADB7] text-xs space-y-1 pt-1">
                                {proj.bulletPoints.map((bp, bIdx) => (
                                  <li key={bIdx} className="leading-relaxed">{bp}</li>
                                ))}
                              </ul>
                            )}
                            {proj.duration && (
                              <p className="text-[#6F7682] text-[10px] pt-0.5">📅 {proj.duration}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-[#A7ADB7] text-xs">• {proj}</p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A7ADB7]">Original Skills List</h4>
                  <div className="p-4 bg-[#0D0F12] border border-[#292D33] rounded-2xl flex flex-wrap gap-2">
                    {(originalData.skills || []).map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#08090B] text-[#A7ADB7] text-xs font-medium">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="p-4 bg-[#0D0F12] border border-[#292D33] rounded-2xl text-[#A7ADB7] text-xs space-y-2">
                  <p>Original parsed structure recorded without machine modifications.</p>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: AI Improved Content with Diff Highlights */}
            <div className="p-6 bg-[#121519] backdrop-blur-xl border border-[#F5B83D]/30 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(245,184,61,0.08)] relative">
              <div className="flex items-center justify-between pb-4 border-b border-[#292D33]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#F5B83D]/10 border border-[#F5B83D]/25 text-[#F5B83D]">
                    <FaMagic size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5]">AI Improved Content</h3>
                    <p className="text-[#A7ADB7] text-xs">Optimized with Google Gemini AI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs uppercase font-semibold bg-[#F5B83D]/10 text-[#FFD166] border border-[#F5B83D]/25">
                    After (Improved)
                  </Badge>

                  <button
                    onClick={() => {
                      const textToCopy =
                        activeTab === 'summary'
                          ? improvementData.improvedSummary
                          : JSON.stringify(improvementData[`improved${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`], null, 2);
                      handleCopyText(textToCopy, activeTab);
                    }}
                    className="p-2 rounded-xl bg-[#0D0F12] hover:bg-[#171A1F] text-[#F5F5F5] border border-[#292D33] transition-colors cursor-pointer"
                    title="Copy section"
                  >
                    {copiedSection === activeTab ? <FaCheck className="text-[#4ADE80]" size={14} /> : <FaCopy size={14} />}
                  </button>
                </div>
              </div>

              {/* TAB 1: IMPROVED SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FFD166]">ATS-Friendly Summary</h4>
                    <button
                      onClick={handleRewriteSummaryOnly}
                      disabled={rewriteLoading}
                      className="text-xs text-[#F5B83D] hover:text-[#FFD166] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {rewriteLoading ? <FaSpinner className="animate-spin" size={10} /> : <FaSync size={10} />} Re-generate Summary
                    </button>
                  </div>

                  <div className="p-5 bg-gradient-to-b from-[#08090B] to-[#0D0F12] border border-[#F5B83D]/30 rounded-2xl text-[#F5F5F5] text-sm leading-relaxed shadow-inner">
                    <TypingText text={improvementData.improvedSummary} speed={10} />
                  </div>
                </div>
              )}

              {/* TAB 2: IMPROVED EXPERIENCE & BULLET POINTS */}
              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FFD166]">Enhanced Work Experience Bullet Points</h4>
                  {(improvementData.improvedExperience || []).map((exp, idx) => (
                    <div key={idx} className="p-4 bg-[#0D0F12] border border-[#F5B83D]/25 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-[#F5F5F5] text-sm">{exp.role}</span>
                          <span className="text-xs text-[#F5B83D] font-medium block">{exp.company}</span>
                        </div>
                        <span className="text-xs text-[#A7ADB7] bg-[#08090B] px-2.5 py-1 rounded-lg border border-[#292D33]">{exp.period}</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-[#FFD166] uppercase tracking-wider block">Quantified Action Bullets:</span>
                        <ul className="space-y-2">
                          {(exp.bulletPoints || []).map((bp, bIdx) => (
                            <li key={bIdx} className="p-2.5 bg-[#F5B83D]/10 border border-[#F5B83D]/20 rounded-xl text-xs text-[#F5F5F5] leading-relaxed flex items-start gap-2">
                              <span className="text-[#F5B83D] font-bold mt-0.5">•</span>
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: IMPROVED PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FFD166]">Optimized Key Projects</h4>
                  {(improvementData.improvedProjects || []).map((proj, idx) => (
                    <div key={idx} className="p-4 bg-[#0D0F12] border border-[#F5B83D]/25 rounded-2xl space-y-3">
                      <h5 className="font-bold text-[#F5F5F5] text-sm">{proj.title}</h5>
                      <p className="text-xs text-[#A7ADB7]">{proj.description}</p>
                      
                      {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {proj.technologies.map((t, tIdx) => (
                            <span key={tIdx} className="px-2.5 py-0.5 rounded-md bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] text-[11px] font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <ul className="space-y-2 pt-1">
                        {(proj.bulletPoints || []).map((bp, bIdx) => (
                          <li key={bIdx} className="p-2.5 bg-[#F5B83D]/10 border border-[#F5B83D]/20 rounded-xl text-xs text-[#F5F5F5] leading-relaxed flex items-start gap-2">
                            <span className="text-[#F5B83D] font-bold mt-0.5">•</span>
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: RECOMMENDED SKILLS CATEGORIZATION */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FFD166]">AI Recommended Skills Matrix</h4>
                  {(() => {
                    const rec = improvementData.recommendedSkills || {};
                    const categories = [
                      { key: 'technicalSkills', title: 'Technical Skills', icon: <FaCode size={14} className="text-[#F5B83D]" /> },
                      { key: 'softSkills', title: 'Soft Skills & Leadership', icon: <FaGraduationCap size={14} className="text-[#FFD166]" /> },
                      { key: 'frameworks', title: 'Frameworks & Libraries', icon: <FaLayerGroup size={14} className="text-[#F5B83D]" /> },
                      { key: 'cloudTechnologies', title: 'Cloud & Infrastructure', icon: <FaCloud size={14} className="text-[#FFD166]" /> },
                      { key: 'devOpsTools', title: 'DevOps & Tooling', icon: <FaTools size={14} className="text-[#F5B83D]" /> }
                    ];

                    return (
                      <div className="grid grid-cols-1 gap-3">
                        {categories.map((cat) => {
                          const items = rec[cat.key] || [];
                          return (
                            <div key={cat.key} className="p-3.5 bg-[#0D0F12] border border-[#292D33] rounded-xl space-y-2">
                              <div className="flex items-center gap-2">
                                {cat.icon}
                                <span className="text-xs font-bold text-[#F5F5F5]">{cat.title}</span>
                                <span className="text-[10px] text-[#A7ADB7] font-mono">({items.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {items.length === 0 ? (
                                  <span className="text-[#6F7682] text-xs italic">None listed</span>
                                ) : (
                                  items.map((item, iIdx) => (
                                    <span key={iIdx} className="px-2.5 py-1 rounded-lg bg-[#08090B] border border-[#292D33] text-[#F5F5F5] text-xs font-medium shadow-sm">
                                      + {item}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 5: OPTIMIZATION NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FFD166]">AI Optimization Insights</h4>
                  <div className="space-y-2">
                    {(improvementData.optimizationNotes || []).map((note, idx) => (
                      <div key={idx} className="p-3 bg-[#0D0F12] border border-[#F5B83D]/25 rounded-xl text-xs text-[#A7ADB7] leading-relaxed flex items-start gap-2.5">
                        <div className="p-1 rounded bg-[#F5B83D]/10 text-[#F5B83D] mt-0.5">
                          <FaLightbulb size={12} />
                        </div>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable element for PDF generation */}
      <div className="hidden">
        <div ref={pdfExportRef} className="p-8 bg-slate-950 text-slate-100 font-sans space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-bold text-white">{selectedResume?.parsedData?.fullName || 'Candidate'} - AI Improved Resume</h1>
            <p className="text-xs text-slate-400">Generated by AI Resume Improvement System on {new Date().toLocaleDateString()}</p>
          </div>

          {improvementData && (
            <>
              <div>
                <h2 className="text-sm font-bold uppercase text-blue-400 border-b border-slate-800 pb-1 mb-2">Professional Summary</h2>
                <p className="text-xs leading-relaxed text-slate-200">{improvementData.improvedSummary}</p>
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase text-blue-400 border-b border-slate-800 pb-1 mb-2">Work Experience</h2>
                {(improvementData.improvedExperience || []).map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>{exp.role} - {exp.company}</span>
                      <span>{exp.period}</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 mt-1">
                      {(exp.bulletPoints || []).map((bp, bi) => (
                        <li key={bi}>{bp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase text-blue-400 border-b border-slate-800 pb-1 mb-2">Key Projects</h2>
                {(improvementData.improvedProjects || []).map((proj, i) => (
                  <div key={i} className="mb-3">
                    <span className="text-xs font-bold text-white">{proj.title}</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 mt-1">
                      {(proj.bulletPoints || []).map((bp, bi) => (
                        <li key={bi}>{bp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase text-blue-400 border-b border-slate-800 pb-1 mb-2">Recommended Skills</h2>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-white">Technical:</strong> {(improvementData.recommendedSkills?.technicalSkills || []).join(', ')}<br />
                  <strong className="text-white">Frameworks:</strong> {(improvementData.recommendedSkills?.frameworks || []).join(', ')}<br />
                  <strong className="text-white">Cloud & DevOps:</strong> {[...(improvementData.recommendedSkills?.cloudTechnologies || []), ...(improvementData.recommendedSkills?.devOpsTools || [])].join(', ')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
