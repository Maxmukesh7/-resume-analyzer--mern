import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaFileWord, 
  FaTimes, 
  FaCheckCircle, 
  FaPlay
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';

export default function ResumeUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

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
      validateAndProcessFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndProcessFile(selectedFile);
    }
  };

  const validateAndProcessFile = (selectedFile) => {
    const name = selectedFile.name.toLowerCase();
    const isValidExtension = name.endsWith('.pdf') || name.endsWith('.docx');

    if (!isValidExtension) {
      showToast('Unsupported format! Please upload PDF or DOCX.', 'error');
      return;
    }

    // Accept file, reset state, and simulate upload
    setFile(selectedFile);
    setUploadProgress(0);
    setUploading(true);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          showToast('File uploaded successfully!', 'success');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    setUploading(false);
    setAnalyzing(false);
    showToast('File removed.', 'info');
  };

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);

    showToast('AI parser is reading content...', 'info');
    
    // Simulate complex scanning algorithm
    setTimeout(() => {
      showToast('Scanned keywords matches successfully!', 'success');
      // Redirect to the first mock report
      navigate('/dashboard/report?id=res-001');
    }, 2500);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
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

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">Upload Resume</h1>
        <p className="text-slate-450 text-xs mt-1.5 font-semibold">
          Upload your resume in PDF or DOCX format to scan and optimize it against ATS systems.
        </p>
      </div>

      <Card className="p-8 relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx"
          className="hidden"
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
              <p className="text-xs text-slate-500 font-semibold mt-1">or click to browse local files</p>
            </div>
            <div className="border border-slate-800/80 bg-slate-900/60 rounded-xl px-4 py-1.5 mt-2 flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>PDF Supported</span>
              <span className="text-slate-700">|</span>
              <span>DOCX Supported</span>
            </div>
          </motion.div>
        )}

        {/* Upload Progress & Preview Container */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* File Info Card */}
              <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-4 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                      {getFriendlySize(file.size)}
                    </span>
                  </div>
                </div>
                {!analyzing && (
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/15 rounded-xl border border-transparent hover:border-rose-900/25 transition-all"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Uploading documents...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* File Uploaded Ready State */}
              {!uploading && !analyzing && (
                <div className="flex items-center gap-3 p-4 bg-emerald-950/10 border border-emerald-900/30 text-emerald-400 rounded-2xl text-xs font-semibold">
                  <FaCheckCircle size={16} />
                  <span>Success! File uploaded and parsed ready for ATS analysis.</span>
                </div>
              )}

              {/* Analyzing Processing Animation State */}
              {analyzing && (
                <div className="space-y-6 py-6 flex flex-col items-center justify-center">
                  {/* Spinner */}
                  <div className="relative">
                    <div className="animate-spin rounded-full border-t-transparent border-slate-800 h-16 w-16 border-4"></div>
                    <div className="absolute top-0 left-0 animate-spin rounded-full border-b-transparent border-l-transparent border-r-transparent border-t-blue-500 h-16 w-16 border-4" style={{ animationDuration: '0.8s' }}></div>
                    <div className="absolute top-0 left-0 animate-spin rounded-full border-t-transparent border-l-transparent border-r-transparent border-b-purple-500 h-16 w-16 border-4" style={{ animationDuration: '1.2s' }}></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white tracking-wide animate-pulse">Running AI ATS Diagnostics...</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Checking keywords matches, structural layouts, and credentials</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!uploading && !analyzing && (
                <div className="flex gap-4">
                  <Button
                    onClick={handleRemoveFile}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    icon={<FaPlay size={10} />}
                    className="flex-1"
                  >
                    Analyze Resume
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h4 className="text-sm font-bold text-white mb-2">Optimize Layout Parsing</h4>
          <p className="text-xs text-slate-450 leading-relaxed font-semibold">
            Ensure your file utilizes a single-column clean format. Multi-columns, custom tables, text boxes, and icons frequently confuse traditional ATS parsers.
          </p>
        </Card>
        <Card>
          <h4 className="text-sm font-bold text-white mb-2">Target High Keyword Counts</h4>
          <p className="text-xs text-slate-450 leading-relaxed font-semibold">
            Incorporate hard industry skills directly from targeted job descriptions. Match terms exactly as written in standard formats.
          </p>
        </Card>
      </div>
    </div>
  );
}
