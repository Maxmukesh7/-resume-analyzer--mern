import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaFileWord, 
  FaTimes, 
  FaCheckCircle,
  FaSpinner,
  FaHistory
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import { useToast } from '../../components/Common/Toast';
import { uploadResume } from '../../services/resumeService';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ResumeUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

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
    const isValidExtension = name.endsWith('.pdf') || name.endsWith('.docx');

    if (!isValidExtension) {
      showToast('Invalid file format. Only PDF (.pdf) and DOCX (.docx) files are allowed.', 'error');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      showToast('File size exceeds maximum limit of 5 MB.', 'error');
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setUploaded(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    setUploading(false);
    setUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('File removed.', 'info');
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      await uploadResume(formData, (progress) => {
        setUploadProgress(progress);
      });

      setUploading(false);
      setUploaded(true);
      setUploadProgress(100);
      showToast('Resume uploaded successfully!', 'success');
    } catch (error) {
      setUploading(false);
      const errorMessage = error.response?.data?.message || 'Failed to upload resume. Please try again.';
      showToast(errorMessage, 'error');
    }
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
          Upload your resume in PDF or DOCX format (Max size: 5MB).
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
              <span>PDF Supported (.pdf)</span>
              <span className="text-slate-700">|</span>
              <span>DOCX Supported (.docx)</span>
              <span className="text-slate-700">|</span>
              <span>Max 5 MB</span>
            </div>
          </motion.div>
        )}

        {/* Preview Card & Upload Status */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* File Info Preview Card */}
              <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
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
                        {uploading && <Badge variant="info">Uploading...</Badge>}
                        {uploaded && <Badge variant="success">Uploaded</Badge>}
                        {!uploading && !uploaded && <Badge variant="neutral">Ready to Upload</Badge>}
                      </span>
                    </div>
                  </div>
                </div>

                {!uploading && (
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/15 rounded-xl border border-transparent hover:border-rose-900/25 transition-all"
                    title="Remove selected file"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-2">
                      <FaSpinner className="animate-spin text-blue-400" />
                      Uploading resume to secure server...
                    </span>
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

              {/* Uploaded Success Message */}
              {uploaded && (
                <div className="flex items-center gap-3 p-4 bg-emerald-950/10 border border-emerald-900/30 text-emerald-400 rounded-2xl text-xs font-semibold">
                  <FaCheckCircle size={16} />
                  <span>Resume uploaded and saved securely to database!</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                {!uploaded ? (
                  <>
                    <Button
                      onClick={handleRemoveFile}
                      variant="outline"
                      className="flex-1"
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadSubmit}
                      className="flex-1"
                      disabled={uploading}
                      icon={uploading ? <FaSpinner className="animate-spin" size={14} /> : <FaCloudUploadAlt size={16} />}
                    >
                      {uploading ? 'Uploading...' : 'Upload Resume'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleRemoveFile}
                      variant="outline"
                      className="flex-1"
                    >
                      Upload Another
                    </Button>
                    <Button
                      onClick={() => navigate('/dashboard/history')}
                      icon={<FaHistory size={14} />}
                      className="flex-1"
                    >
                      View History
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
