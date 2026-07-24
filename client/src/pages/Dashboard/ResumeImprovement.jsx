import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import {
  FaMagic,
  FaRobot,
  FaCopy,
  FaDownload,
  FaSync,
  FaCheck,
  FaExchangeAlt,
  FaFileAlt,
  FaFilePdf,
  FaGraduationCap,
  FaBriefcase,
  FaCode,
  FaCloud,
  FaTools,
  FaLightbulb,
  FaArrowRight,
  FaChevronDown,
  FaEdit,
  FaSpinner,
  FaLayerGroup,
  FaTerminal
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Badge from '../../components/Common/Badge';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { getResumes } from '../../services/resumeService';
import {
  improveFullResume,
  getResumeImprovements,
  rewriteSummary,
  rewriteProject,
  rewriteExperience
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
  const navigate = useNavigate();
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
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <FaMagic size={12} className="animate-spin-slow" /> Phase 12 Engine
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              AI Resume <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Rewriter & Optimizer</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
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
                className="w-full pl-4 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
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
              <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <Button
              onClick={() => handleGenerateImprovements(false)}
              disabled={generating || !selectedResumeId}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/25 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap"
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
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Experience Level
            </label>
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setExperienceLevel('Fresher')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  experienceLevel === 'Fresher'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FaGraduationCap size={12} /> Fresher / Entry
              </button>
              <button
                type="button"
                onClick={() => setExperienceLevel('Experienced')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  experienceLevel === 'Experienced'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FaBriefcase size={12} /> Experienced
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Target Industry / Role
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Full Stack Developer, DevOps Engineer"
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Target Job Description (Optional)
            </label>
            <input
              type="text"
              value={targetJobDescription}
              onChange={(e) => setTargetJobDescription(e.target.value)}
              placeholder="Paste Job Description snippet..."
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
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
        <Card className="p-12 text-center bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FaMagic size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No AI Improvements Generated Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Click <span className="text-blue-400 font-semibold">"Improve Resume"</span> above to trigger Google Gemini AI re-writing, bullet point enhancement, and ATS skill recommendations.
          </p>
          <Button
            onClick={() => handleGenerateImprovements(false)}
            disabled={generating || !selectedResumeId}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-600/30"
          >
            Start AI Resume Improvement
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar & Export Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl">
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-400/30'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950/40 border border-slate-800'
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
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <FaSync size={12} className={generating ? 'animate-spin' : ''} /> Regenerate
              </Button>

              <Button
                onClick={handleDownloadTxt}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <FaFileAlt size={12} /> TXT
              </Button>

              <Button
                onClick={handleDownloadPdf}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <FaFilePdf size={12} /> PDF Download
              </Button>
            </div>
          </div>

          {/* Side-by-Side Comparison Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT PANEL: Original Resume Content */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <FaFileAlt size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Original Content</h3>
                    <p className="text-slate-400 text-xs">Unmodified parsed resume data</p>
                  </div>
                </div>
                <Badge variant="warning" className="text-xs uppercase font-semibold">Before</Badge>
              </div>

              {activeTab === 'summary' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Professional Summary</h4>
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-300 text-sm leading-relaxed min-h-[140px]">
                    {originalData.summary || 'No original summary detected in uploaded document.'}
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Work Experience Entries</h4>
                  {(!originalData.experience || originalData.experience.length === 0) ? (
                    <p className="text-slate-500 text-xs italic">No experience entries found in original resume.</p>
                  ) : (
                    originalData.experience.map((exp, idx) => (
                      <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white text-sm">{exp.role || 'Role'}</span>
                          <span className="text-xs text-slate-400">{exp.period}</span>
                        </div>
                        <p className="text-xs text-blue-400 font-medium">{exp.company}</p>
                        <ul className="list-disc list-inside text-slate-300 text-xs space-y-1 pt-1">
                          {(exp.bulletPoints?.length ? exp.bulletPoints : [exp.description]).map((bp, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">{bp}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Key Projects</h4>
                  {(!originalData.projects || originalData.projects.length === 0) ? (
                    <p className="text-slate-500 text-xs italic">No project entries found in original resume.</p>
                  ) : (
                    originalData.projects.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                        <h5 className="font-bold text-white text-sm">{proj.title || 'Project'}</h5>
                        <p className="text-xs text-slate-300">{proj.description}</p>
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.technologies.map((t, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Original Skills List</h4>
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-wrap gap-2">
                    {(originalData.skills || []).map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-400 text-xs space-y-2">
                  <p>Original parsed structure recorded without machine modifications.</p>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: AI Improved Content with Diff Highlights */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(37,99,235,0.1)] relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <FaMagic size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">AI Improved Content</h3>
                    <p className="text-slate-400 text-xs">Optimized with Google Gemini AI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    title="Copy section"
                  >
                    {copiedSection === activeTab ? <FaCheck className="text-emerald-400" size={14} /> : <FaCopy size={14} />}
                  </button>
                </div>
              </div>

              {/* TAB 1: IMPROVED SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">ATS-Friendly Summary</h4>
                    <button
                      onClick={handleRewriteSummaryOnly}
                      disabled={rewriteLoading}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      {rewriteLoading ? <FaSpinner className="animate-spin" size={10} /> : <FaSync size={10} />} Re-generate Summary
                    </button>
                  </div>

                  <div className="p-5 bg-gradient-to-b from-slate-950 to-slate-900 border border-emerald-500/30 rounded-2xl text-slate-100 text-sm leading-relaxed shadow-inner">
                    <TypingText text={improvementData.improvedSummary} speed={10} />
                  </div>
                </div>
              )}

              {/* TAB 2: IMPROVED EXPERIENCE & BULLET POINTS */}
              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Enhanced Work Experience Bullet Points</h4>
                  {(improvementData.improvedExperience || []).map((exp, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-white text-sm">{exp.role}</span>
                          <span className="text-xs text-blue-400 font-medium block">{exp.company}</span>
                        </div>
                        <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{exp.period}</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Quantified Action Bullets:</span>
                        <ul className="space-y-2">
                          {(exp.bulletPoints || []).map((bp, bIdx) => (
                            <li key={bIdx} className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-200 leading-relaxed flex items-start gap-2">
                              <span className="text-emerald-400 font-bold mt-0.5">•</span>
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
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Optimized Key Projects</h4>
                  {(improvementData.improvedProjects || []).map((proj, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-3">
                      <h5 className="font-bold text-white text-sm">{proj.title}</h5>
                      <p className="text-xs text-slate-300">{proj.description}</p>
                      
                      {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {proj.technologies.map((t, tIdx) => (
                            <span key={tIdx} className="px-2.5 py-0.5 rounded-md bg-blue-950 border border-blue-500/30 text-blue-300 text-[11px] font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <ul className="space-y-2 pt-1">
                        {(proj.bulletPoints || []).map((bp, bIdx) => (
                          <li key={bIdx} className="p-2.5 bg-blue-950/20 border border-blue-500/20 rounded-xl text-xs text-blue-200 leading-relaxed flex items-start gap-2">
                            <span className="text-blue-400 font-bold mt-0.5">•</span>
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
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">AI Recommended Skills Matrix</h4>
                  {(() => {
                    const rec = improvementData.recommendedSkills || {};
                    const categories = [
                      { key: 'technicalSkills', title: 'Technical Skills', icon: <FaCode size={14} className="text-blue-400" /> },
                      { key: 'softSkills', title: 'Soft Skills & Leadership', icon: <FaGraduationCap size={14} className="text-purple-400" /> },
                      { key: 'frameworks', title: 'Frameworks & Libraries', icon: <FaLayerGroup size={14} className="text-emerald-400" /> },
                      { key: 'cloudTechnologies', title: 'Cloud & Infrastructure', icon: <FaCloud size={14} className="text-sky-400" /> },
                      { key: 'devOpsTools', title: 'DevOps & Tooling', icon: <FaTools size={14} className="text-amber-400" /> }
                    ];

                    return (
                      <div className="grid grid-cols-1 gap-3">
                        {categories.map((cat) => {
                          const items = rec[cat.key] || [];
                          return (
                            <div key={cat.key} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                              <div className="flex items-center gap-2">
                                {cat.icon}
                                <span className="text-xs font-bold text-white">{cat.title}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({items.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {items.length === 0 ? (
                                  <span className="text-slate-500 text-xs italic">None listed</span>
                                ) : (
                                  items.map((item, iIdx) => (
                                    <span key={iIdx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-medium shadow-sm">
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
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">AI Optimization Insights</h4>
                  <div className="space-y-2">
                    {(improvementData.optimizationNotes || []).map((note, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-blue-500/20 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                        <div className="p-1 rounded bg-blue-500/10 text-blue-400 mt-0.5">
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
