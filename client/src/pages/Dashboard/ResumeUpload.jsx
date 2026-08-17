import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaFileWord, 
  FaTimes, 
  FaCheckCircle,
  FaSpinner,
  FaHistory,
  FaRobot,
  FaTrophy,
  FaFileAlt,
  FaExclamationTriangle,
  FaArrowRight,
  FaSync,
  FaClock
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import { useToast } from '../../components/Common/Toast';
import { uploadResume, parseResume, analyzeResume } from '../../services/resumeService';
import { analyzeResumeWithAI } from '../../services/aiService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Analysis pipeline steps
const PIPELINE_STEPS = [
  { id: 'upload', title: 'Uploading Resume', icon: FaCloudUploadAlt, desc: 'Securely uploading file to storage' },
  { id: 'parse', title: 'Parsing Resume', icon: FaFileAlt, desc: 'Extracting candidate details & skills' },
  { id: 'ats', title: 'Calculating ATS Score', icon: FaTrophy, desc: 'Evaluating keywords & section weights' },
  { id: 'ai', title: 'AI Analysis', icon: FaRobot, desc: 'Generating Gemini AI feedback & roadmap' },
  { id: 'finalize', title: 'Finalizing Results', icon: FaCheckCircle, desc: 'Saving and assembling dashboard' }
];

export default function ResumeUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Pipeline State: 'IDLE' | 'UPLOADING' | 'PARSING' | 'ATS_ANALYSIS' | 'AI_ANALYSIS' | 'COMPLETED' | 'FAILED' | 'ATS_COMPLETED_AI_FAILED'
  const [pipelineState, setPipelineState] = useState('IDLE');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState({
    upload: 'pending',   // 'pending' | 'active' | 'completed' | 'failed'
    parse: 'pending',
    ats: 'pending',
    ai: 'pending',
    finalize: 'pending'
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [failedStep, setFailedStep] = useState(null); // 'upload' | 'parse' | 'ats' | 'ai'
  const [uploadedResumeId, setUploadedResumeId] = useState(null);
  const [parsedCandidateName, setParsedCandidateName] = useState('');
  const [atsScore, setAtsScore] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Auto-redirect countdown effect
  useEffect(() => {
    let timer;
    if (pipelineState === 'COMPLETED' && uploadedResumeId && redirectCountdown !== null) {
      if (redirectCountdown > 0) {
        timer = setTimeout(() => {
          setRedirectCountdown((prev) => prev - 1);
        }, 1000);
      } else if (redirectCountdown === 0) {
        navigate(`/dashboard/analysis/${uploadedResumeId}`);
      }
    }
    return () => clearTimeout(timer);
  }, [pipelineState, uploadedResumeId, redirectCountdown, navigate]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSelectFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSelectFile(selectedFile);
    }
  };

  const validateAndSelectFile = (selectedFile) => {
    const name = selectedFile.name.toLowerCase();
    const isValidExtension = name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');

    if (!isValidExtension) {
      showToast('Invalid file format. Only PDF (.pdf), DOC (.doc), and DOCX (.docx) files are allowed.', 'error');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      showToast('File size exceeds maximum limit of 5 MB.', 'error');
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setPipelineState('IDLE');
    setFailedStep(null);
    setErrorMessage('');
    setStepStatuses({
      upload: 'pending',
      parse: 'pending',
      ats: 'pending',
      ai: 'pending',
      finalize: 'pending'
    });
  };

  const handleRemoveFile = (quiet = false) => {
    setFile(null);
    setUploadProgress(0);
    setPipelineState('IDLE');
    setUploadedResumeId(null);
    setParsedCandidateName('');
    setAtsScore(null);
    setFailedStep(null);
    setErrorMessage('');
    setRedirectCountdown(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!quiet) {
      showToast('File selection cleared.', 'info');
    }
  };

  // STEP-BY-STEP ORCHESTRATOR
  const executePipeline = async (resumeId = null, startFromStep = 'upload') => {
    let activeResumeId = resumeId;

    // STEP 1: UPLOAD & TEXT EXTRACTION
    if (startFromStep === 'upload') {
      try {
        setPipelineState('UPLOADING');
        setCurrentStepIndex(0);
        setStepStatuses((prev) => ({ ...prev, upload: 'active' }));

        const formData = new FormData();
        formData.append('resume', file);

        const uploadRes = await uploadResume(formData, (progress) => {
          setUploadProgress(progress);
        });

        const createdResume = uploadRes.data || uploadRes;
        activeResumeId = createdResume._id || createdResume.id;
        setUploadedResumeId(activeResumeId);

        setUploadProgress(100);
        setStepStatuses((prev) => ({ ...prev, upload: 'completed' }));
        showToast('Resume uploaded successfully!', 'success');

        // Check if parser returned name in upload response
        if (createdResume.parsedData?.fullName) {
          setParsedCandidateName(createdResume.parsedData.fullName);
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'File upload failed.';
        setPipelineState('FAILED');
        setFailedStep('upload');
        setErrorMessage(msg);
        setStepStatuses((prev) => ({ ...prev, upload: 'failed' }));
        showToast(msg, 'error');
        return;
      }
    }

    // STEP 2: PARSING
    if (startFromStep === 'upload' || startFromStep === 'parse') {
      try {
        setPipelineState('PARSING');
        setCurrentStepIndex(1);
        setStepStatuses((prev) => ({ ...prev, parse: 'active' }));

        // Call parseResume to ensure fresh structure
        const parseRes = await parseResume(activeResumeId, false);
        const parsedDoc = parseRes.data || parseRes;
        if (parsedDoc.parsedData?.fullName) {
          setParsedCandidateName(parsedDoc.parsedData.fullName);
        }

        setStepStatuses((prev) => ({ ...prev, parse: 'completed' }));
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Parsing failed.';
        setPipelineState('FAILED');
        setFailedStep('parse');
        setErrorMessage(`Resume parsing error: ${msg}`);
        setStepStatuses((prev) => ({ ...prev, parse: 'failed' }));
        showToast(`Parsing failed: ${msg}`, 'error');
        return;
      }
    }

    // STEP 3: ATS ANALYSIS
    if (startFromStep === 'upload' || startFromStep === 'parse' || startFromStep === 'ats') {
      try {
        setPipelineState('ATS_ANALYSIS');
        setCurrentStepIndex(2);
        setStepStatuses((prev) => ({ ...prev, ats: 'active' }));

        const atsRes = await analyzeResume(activeResumeId, false);
        const atsData = atsRes.data || atsRes;
        if (atsData && typeof atsData.overallScore === 'number') {
          setAtsScore(atsData.overallScore);
        }

        setStepStatuses((prev) => ({ ...prev, ats: 'completed' }));
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'ATS evaluation failed.';
        setPipelineState('FAILED');
        setFailedStep('ats');
        setErrorMessage(`ATS Score calculation error: ${msg}`);
        setStepStatuses((prev) => ({ ...prev, ats: 'failed' }));
        showToast(`ATS Evaluation failed: ${msg}`, 'error');
        return;
      }
    }

    // STEP 4: AI ANALYSIS (GEMINI)
    if (startFromStep === 'upload' || startFromStep === 'parse' || startFromStep === 'ats' || startFromStep === 'ai') {
      try {
        setPipelineState('AI_ANALYSIS');
        setCurrentStepIndex(3);
        setStepStatuses((prev) => ({ ...prev, ai: 'active' }));

        await analyzeResumeWithAI(activeResumeId, false);

        setStepStatuses((prev) => ({ ...prev, ai: 'completed' }));
      } catch (err) {
        console.warn('⚠️ AI analysis step error:', err.message);
        // DO NOT LOSE ATS RESULTS!
        const msg = err.response?.data?.message || err.message || 'AI analysis could not be completed.';
        setPipelineState('ATS_COMPLETED_AI_FAILED');
        setFailedStep('ai');
        setErrorMessage('ATS analysis completed. AI analysis could not be completed.');
        setStepStatuses((prev) => ({ ...prev, ai: 'failed' }));
        showToast('ATS analysis completed. AI analysis could not be completed.', 'warning');
        return;
      }
    }

    // STEP 5: FINALIZING & REDIRECT
    setPipelineState('COMPLETED');
    setCurrentStepIndex(4);
    setStepStatuses((prev) => ({ ...prev, finalize: 'completed' }));
    showToast('Resume analysis completed successfully!', 'success');
    setRedirectCountdown(3); // 3-second auto-redirect
  };

  const handleStartAnalysis = () => {
    if (!file) {
      showToast('Please select a resume file first.', 'error');
      return;
    }
    executePipeline(null, 'upload');
  };

  // RETRY HANDLERS
  const handleRetryStep = (stepKey) => {
    if (!uploadedResumeId && stepKey !== 'upload') {
      executePipeline(null, 'upload');
      return;
    }
    setErrorMessage('');
    setFailedStep(null);
    executePipeline(uploadedResumeId, stepKey);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName) => {
    if (fileName?.toLowerCase().endsWith('.pdf')) {
      return <FaFilePdf className="text-red-400" size={32} />;
    }
    return <FaFileWord className="text-blue-400" size={32} />;
  };

  const getFriendlySize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const isBusy = ['UPLOADING', 'PARSING', 'ATS_ANALYSIS', 'AI_ANALYSIS'].includes(pipelineState);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">Automatic Resume Analysis</h1>
        <p className="text-slate-450 text-xs mt-1.5 font-semibold">
          Upload your resume. Our pipeline automatically extracts text, evaluates ATS compatibility, and generates Gemini AI insights in one seamless workflow.
        </p>
      </div>

      <Card className="p-8 relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          className="hidden"
          disabled={isBusy}
        />

        {/* Drag and Drop Zone */}
        {!file && (
          <motion.div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            whileHover={{ scale: 1.005, borderColor: 'rgba(99,102,241,0.45)' }}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 min-h-[300px] text-center
              ${dragActive 
                ? 'border-blue-500 bg-blue-900/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                : 'border-slate-800 bg-slate-900/15 hover:bg-slate-900/30'
              }`}
          >
            <div className="p-5 bg-slate-800/60 rounded-full border border-slate-700/50 text-blue-400 shadow-md">
              <FaCloudUploadAlt size={42} className="animate-bounce" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-200">Drag & drop your resume file here</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">or click to browse local files (PDF, DOC, DOCX)</p>
            </div>
            <div className="border border-slate-800/80 bg-slate-900/60 rounded-xl px-4 py-1.5 mt-2 flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>PDF (.pdf)</span>
              <span className="text-slate-700">|</span>
              <span>DOC (.doc)</span>
              <span className="text-slate-700">|</span>
              <span>DOCX (.docx)</span>
              <span className="text-slate-700">|</span>
              <span>Max 5 MB</span>
            </div>
          </motion.div>
        )}

        {/* Selected File & Multi-Step Analysis Stepper */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* File Info Preview Card */}
              <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-4 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 font-semibold">
                        {getFriendlySize(file.size)}
                      </span>
                      <span className="text-slate-700">&bull;</span>
                      <span className="text-xs font-semibold">
                        {pipelineState === 'IDLE' && <Badge variant="neutral">Ready to Analyze</Badge>}
                        {isBusy && <Badge variant="info">Analyzing...</Badge>}
                        {pipelineState === 'COMPLETED' && <Badge variant="success">Completed</Badge>}
                        {pipelineState === 'ATS_COMPLETED_AI_FAILED' && <Badge variant="warning">Partial</Badge>}
                        {pipelineState === 'FAILED' && <Badge variant="danger">Failed</Badge>}
                      </span>
                    </div>
                  </div>
                </div>

                {!isBusy && (
                  <button
                    onClick={() => handleRemoveFile(false)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/15 rounded-xl border border-transparent hover:border-rose-900/25 transition-all"
                    title="Remove selected file"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>

              {/* AUTOMATIC MULTI-STEP PROGRESS INDICATOR */}
              {pipelineState !== 'IDLE' && (
                <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                        Analysis Progress
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {pipelineState === 'COMPLETED'
                          ? 'All analysis stages finished successfully.'
                          : pipelineState === 'ATS_COMPLETED_AI_FAILED'
                          ? 'ATS evaluation complete. AI analysis encountered an issue.'
                          : pipelineState === 'FAILED'
                          ? 'Pipeline interrupted. You can retry the failed stage.'
                          : 'Processing resume through automated intelligence engines...'}
                      </p>
                    </div>

                    {parsedCandidateName && (
                      <span className="text-xs font-bold text-blue-400 bg-blue-950/40 px-3 py-1 rounded-xl border border-blue-800/40">
                        Candidate: {parsedCandidateName}
                      </span>
                    )}
                  </div>

                  {/* Visual Stepper List */}
                  <div className="space-y-3">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const status = stepStatuses[step.id];
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                            status === 'completed'
                              ? 'bg-emerald-950/15 border-emerald-800/30 text-emerald-300'
                              : status === 'active'
                              ? 'bg-blue-950/20 border-blue-700/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                              : status === 'failed'
                              ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                              : 'bg-slate-900/30 border-slate-850/60 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`p-2 rounded-xl border ${
                                status === 'completed'
                                  ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                                  : status === 'active'
                                  ? 'bg-blue-950/60 border-blue-600/50 text-blue-400'
                                  : status === 'failed'
                                  ? 'bg-rose-950/60 border-rose-700/50 text-rose-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-600'
                              }`}
                            >
                              <Icon size={16} />
                            </div>

                            <div className="min-w-0">
                              <h5 className="text-xs font-bold tracking-wide flex items-center gap-2">
                                <span>{step.title}</span>
                                {step.id === 'ats' && atsScore !== null && (
                                  <span className="text-[11px] font-extrabold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                                    Score: {atsScore}/100
                                  </span>
                                )}
                              </h5>
                              <p className="text-[11px] opacity-75 truncate">{step.desc}</p>
                            </div>
                          </div>

                          {/* Status Indicator Icon */}
                          <div>
                            {status === 'completed' && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <FaCheckCircle size={15} />
                                <span>Completed</span>
                              </span>
                            )}
                            {status === 'active' && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                                <FaSpinner size={14} className="animate-spin" />
                                <span>Processing...</span>
                              </span>
                            )}
                            {status === 'failed' && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                <FaExclamationTriangle size={14} />
                                <span>Failed</span>
                              </span>
                            )}
                            {status === 'pending' && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                <FaClock size={13} />
                                <span>Queued</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upload Progress Bar if currently uploading */}
                  {pipelineState === 'UPLOADING' && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Uploading stream...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Success Banner on Complete */}
                  {pipelineState === 'COMPLETED' && (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 text-emerald-300 font-semibold">
                        <FaCheckCircle size={20} className="text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-200">Resume analysis completed successfully.</p>
                          <p className="text-[11px] text-emerald-400/80">
                            {redirectCountdown !== null
                              ? `Redirecting to Complete Analysis Dashboard in ${redirectCountdown}s...`
                              : 'All results saved to database.'}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        icon={<FaArrowRight size={12} />}
                        onClick={() => navigate(`/dashboard/analysis/${uploadedResumeId}`)}
                      >
                        View Dashboard Now
                      </Button>
                    </div>
                  )}

                  {/* Partial AI Error Banner */}
                  {pipelineState === 'ATS_COMPLETED_AI_FAILED' && (
                    <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 text-amber-300 font-semibold">
                        <FaExclamationTriangle size={20} className="text-amber-400 shrink-0" />
                        <div>
                          <p className="font-bold text-amber-200">ATS analysis completed. AI analysis could not be completed.</p>
                          <p className="text-[11px] text-amber-400/80">
                            Your ATS score and parsed resume details were saved successfully.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<FaSync size={11} />}
                          onClick={() => handleRetryStep('ai')}
                        >
                          Retry AI Analysis
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<FaArrowRight size={11} />}
                          onClick={() => navigate(`/dashboard/analysis/${uploadedResumeId}`)}
                        >
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* General Failure Banner & Specific Retries */}
                  {pipelineState === 'FAILED' && (
                    <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 text-rose-300 font-semibold">
                        <FaExclamationTriangle size={20} className="text-rose-400 shrink-0" />
                        <div>
                          <p className="font-bold text-rose-200">Operation Failed</p>
                          <p className="text-[11px] text-rose-400/80">{errorMessage}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {failedStep === 'parse' && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<FaSync size={11} />}
                            onClick={() => handleRetryStep('parse')}
                          >
                            Retry Parsing
                          </Button>
                        )}
                        {failedStep === 'ats' && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<FaSync size={11} />}
                            onClick={() => handleRetryStep('ats')}
                          >
                            Retry ATS Analysis
                          </Button>
                        )}
                        {failedStep === 'upload' && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<FaSync size={11} />}
                            onClick={() => handleRetryStep('upload')}
                          >
                            Retry Upload
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Buttons */}
              <div className="flex gap-4">
                {pipelineState === 'IDLE' ? (
                  <>
                    <Button
                      onClick={() => handleRemoveFile(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartAnalysis}
                      className="flex-1"
                      variant="primary"
                      icon={<FaCloudUploadAlt size={16} />}
                    >
                      Upload & Auto-Analyze
                    </Button>
                  </>
                ) : pipelineState === 'COMPLETED' || pipelineState === 'ATS_COMPLETED_AI_FAILED' ? (
                  <>
                    <Button
                      onClick={() => handleRemoveFile(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      Upload Another
                    </Button>
                    <Button
                      onClick={() => navigate(`/dashboard/analysis/${uploadedResumeId}`)}
                      icon={<FaArrowRight size={14} />}
                      variant="primary"
                      className="flex-1"
                    >
                      Complete Analysis Dashboard
                    </Button>
                  </>
                ) : pipelineState === 'FAILED' ? (
                  <Button
                    onClick={() => handleRemoveFile(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    Select Different File
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="w-full opacity-60"
                    icon={<FaSpinner className="animate-spin" size={14} />}
                  >
                    Analysis in Progress... Please Wait
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
