import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  FaCopy,
  FaChartBar
} from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import { useToast } from '../../components/Common/Toast';
import { getResumeById, parseResume } from '../../services/resumeService';

export default function ResumeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [activeTab, setActiveTab] = useState('parsed'); // 'parsed' | 'text'

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getResumeById(id);
      const data = res.data || res;
      setResume(data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch resume details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleReparse = async () => {
    try {
      setParsing(true);
      const res = await parseResume(id, true);
      const data = res.data || res;
      setResume(data);
      showToast('Resume parsed successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to parse resume.', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleCopyText = () => {
    if (resume?.parsedText) {
      navigator.clipboard.writeText(resume.parsedText);
      showToast('Raw resume text copied to clipboard!', 'success');
    }
  };

  const getFriendlySize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-[#A7ADB7]">
        <FaSpinner className="animate-spin text-[#F5B83D]" size={28} />
        <span className="text-xs font-semibold">Loading candidate resume details...</span>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-center py-12">
        <Card className="p-8 space-y-4 bg-[#121519] border-[#292D33]">
          <FaExclamationTriangle className="text-[#F5B83D] mx-auto" size={36} />
          <h2 className="text-xl font-bold text-[#F5F5F5]">Resume Not Found</h2>
          <p className="text-xs text-[#A7ADB7] max-w-md mx-auto">
            The requested resume record could not be found or you do not have permission to view it.
          </p>
          <Button icon={<FaArrowLeft size={12} />} onClick={() => navigate('/dashboard/history')}>
            Back to Resume History
          </Button>
        </Card>
      </div>
    );
  }

  const parsed = resume.parsedData || {};
  const isParsed = resume.parseStatus === 'parsed';
  const isFailed = resume.parseStatus === 'failed';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/history')}
            className="p-2.5 bg-[#0D0F12] border border-[#292D33] rounded-xl text-[#A7ADB7] hover:text-[#F5F5F5] hover:border-[#F5B83D]/40 transition-all cursor-pointer"
            title="Back to History"
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-[#F5F5F5] tracking-wide truncate max-w-md" title={resume.originalName}>
              {resume.originalName || resume.fileName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-[#A7ADB7] font-medium">
              <span>Uploaded {new Date(resume.uploadDate || resume.createdAt).toLocaleDateString()}</span>
              <span>&bull;</span>
              <span>{getFriendlySize(resume.fileSize)}</span>
              <span>&bull;</span>
              <Badge variant={isParsed ? 'success' : isFailed ? 'danger' : 'info'}>
                Status: {resume.parseStatus || 'pending'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(`/dashboard/analysis/${id}`)}
            variant="primary"
            icon={<FaChartBar size={12} />}
          >
            Complete Analysis
          </Button>
          <Button
            onClick={handleReparse}
            variant="outline"
            disabled={parsing}
            icon={<FaSync className={parsing ? 'animate-spin' : ''} size={12} />}
          >
            {parsing ? 'Parsing...' : 'Re-parse Resume'}
          </Button>
        </div>
      </div>

      {/* Parsing Status Banner if failed or pending */}
      {isFailed && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-[#F87171] font-medium">
            <FaExclamationTriangle size={18} />
            <span>
              <strong>Parsing Error:</strong> {resume.parseError || 'Failed to extract text from document.'}
            </span>
          </div>
          <Button size="sm" variant="danger" onClick={handleReparse} disabled={parsing}>
            Retry Parsing
          </Button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-[#292D33] gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('parsed')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'parsed'
              ? 'border-[#F5B83D] text-[#FFD166]'
              : 'border-transparent text-[#A7ADB7] hover:text-[#F5F5F5]'
          }`}
        >
          Extracted Candidate Information
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'text'
              ? 'border-[#F5B83D] text-[#FFD166]'
              : 'border-transparent text-[#A7ADB7] hover:text-[#F5F5F5]'
          }`}
        >
          Raw Extracted Resume Text ({resume.parsedText ? resume.parsedText.length : 0} chars)
        </button>
      </div>

      {/* TAB 1: Parsed Candidate Details Cards */}
      {activeTab === 'parsed' && (
        <div className="space-y-6">
          {/* Candidate Profile Summary Card */}
          <Card className="p-6 bg-[#121519] border-[#292D33]">
            <div className="flex items-start justify-between gap-4 border-b border-[#292D33] pb-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-[#F5B83D]/10 border border-[#F5B83D]/25 text-[#F5B83D] rounded-2xl">
                  <FaUser size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#F5F5F5]">
                    {parsed.fullName || 'Candidate'}
                  </h2>
                  <p className="text-xs text-[#A7ADB7] font-semibold mt-0.5">
                    Parsed Candidate Profile Overview
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                <FaEnvelope className="text-[#F5B83D] shrink-0" size={14} />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">Email Address</span>
                  <span className="text-[#F5F5F5] font-semibold truncate block" title={parsed.email || 'N/A'}>
                    {parsed.email || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                <FaPhone className="text-[#FFD166] shrink-0" size={14} />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">Phone Number</span>
                  <span className="text-[#F5F5F5] font-semibold truncate block" title={parsed.phone || 'N/A'}>
                    {parsed.phone || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                <FaMapMarkerAlt className="text-[#F87171] shrink-0" size={14} />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">Location</span>
                  <span className="text-[#F5F5F5] font-semibold truncate block" title={parsed.location || 'N/A'}>
                    {parsed.location || 'Not provided'}
                  </span>
                </div>
              </div>

              {parsed.linkedin && (
                <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                  <FaLinkedin className="text-[#60A5FA] shrink-0" size={14} />
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">LinkedIn Profile</span>
                    <a
                      href={parsed.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD166] hover:underline font-semibold truncate block"
                    >
                      {parsed.linkedin}
                    </a>
                  </div>
                </div>
              )}

              {parsed.github && (
                <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                  <FaGithub className="text-[#F5F5F5] shrink-0" size={14} />
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">GitHub Profile</span>
                    <a
                      href={parsed.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD166] hover:underline font-semibold truncate block"
                    >
                      {parsed.github}
                    </a>
                  </div>
                </div>
              )}

              {parsed.portfolio && (
                <div className="flex items-center gap-3 p-3 bg-[#0D0F12] border border-[#292D33] rounded-xl">
                  <FaGlobe className="text-[#F5B83D] shrink-0" size={14} />
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#A7ADB7] uppercase font-bold block">Portfolio Website</span>
                    <a
                      href={parsed.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFD166] hover:underline font-semibold truncate block"
                    >
                      {parsed.portfolio}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Skills Card */}
          <Card className="p-6 space-y-5 bg-[#121519] border-[#292D33]">
            <div className="flex items-center gap-3 border-b border-[#292D33] pb-3">
              <FaCode className="text-[#F5B83D]" size={18} />
              <h3 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                Skills Profile ({parsed.skills?.length || 0})
              </h3>
            </div>

            {/* Technical Skills Sub-Section */}
            {parsed.technicalSkills && parsed.technicalSkills.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] text-[#FFD166] font-bold uppercase tracking-wider block">
                  Technical Stack & Technologies ({parsed.technicalSkills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {parsed.technicalSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] rounded-xl text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Skills Sub-Section */}
            {parsed.softSkills && parsed.softSkills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#292D33]">
                <span className="text-[11px] text-[#F5B83D] font-bold uppercase tracking-wider block">
                  Soft Skills & Professional Competencies ({parsed.softSkills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {parsed.softSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#171A1F] border border-[#FFD166]/25 text-[#FFD166] rounded-xl text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback All Skills if categorized arrays not populated */}
            {(!parsed.technicalSkills || parsed.technicalSkills.length === 0) &&
             (!parsed.softSkills || parsed.softSkills.length === 0) && (
              parsed.skills && parsed.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {parsed.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#171A1F] border border-[#F5B83D]/30 text-[#FFD166] rounded-xl text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6F7682]">No explicit technical or soft skills identified in document.</p>
              )
            )}
          </Card>

          {/* Education & Experience Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education Card */}
            <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-3">
                <FaGraduationCap className="text-[#F5B83D]" size={18} />
                <h3 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Education ({parsed.education?.length || 0})
                </h3>
              </div>
              {parsed.education && parsed.education.length > 0 ? (
                <ul className="space-y-3 text-xs">
                  {parsed.education.map((edu, idx) => (
                    <li key={idx} className="pt-2 border-t border-[#292D33] first:border-t-0 first:pt-0">
                      {typeof edu === 'object' && edu !== null ? (
                        <div className="space-y-0.5">
                          {edu.degree && (
                            <p className="text-[#F5F5F5] font-bold">{edu.degree}</p>
                          )}
                          {edu.institution && (
                            <p className="text-[#FFD166] font-medium">{edu.institution}</p>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[#A7ADB7]">
                            {edu.year && <span>📅 {edu.year}</span>}
                            {edu.grade && <span>🎯 {edu.grade}</span>}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#F5F5F5] font-medium">{edu}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No education entries extracted.</p>
              )}
            </Card>

            {/* Experience Card */}
            <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-3">
                <FaBriefcase className="text-[#FFD166]" size={16} />
                <h3 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Work Experience ({parsed.experience?.length || 0})
                </h3>
              </div>
              {parsed.experience && parsed.experience.length > 0 ? (
                <ul className="space-y-4 text-xs divide-y divide-[#292D33]">
                  {parsed.experience.map((exp, idx) => (
                    <li key={idx} className="pt-3 first:pt-0">
                      {typeof exp === 'object' && exp !== null ? (
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[#F5F5F5] font-bold">{exp.role || 'Role'}</p>
                              <p className="text-[#FFD166] font-medium">{exp.company}</p>
                            </div>
                            {exp.period && (
                              <span className="text-[#A7ADB7] text-[10px] whitespace-nowrap mt-0.5 bg-[#08090B] px-2 py-0.5 rounded-lg border border-[#292D33]">
                                {exp.period}
                              </span>
                            )}
                          </div>
                          {(exp.bulletPoints?.length > 0) && (
                            <ul className="list-disc list-inside space-y-0.5 pl-1">
                              {exp.bulletPoints.slice(0, 4).map((bp, bIdx) => (
                                <li key={bIdx} className="text-[#A7ADB7] leading-relaxed">{bp}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <p className="text-[#F5F5F5] font-medium">{exp}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6F7682]">No work experience entries extracted.</p>
              )}
            </Card>
          </div>

          {/* Projects, Certifications & Languages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Projects */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-[#F5B83D]" size={14} />
                <h3 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Projects ({parsed.projects?.length || 0})
                </h3>
              </div>
              {parsed.projects && parsed.projects.length > 0 ? (
                <ul className="space-y-3 text-xs">
                  {parsed.projects.map((proj, idx) => (
                    <li key={idx} className="border-t border-[#292D33] pt-2.5 first:border-t-0 first:pt-0">
                      {typeof proj === 'object' && proj !== null ? (
                        <div className="space-y-1">
                          <p className="text-[#F5F5F5] font-bold truncate" title={proj.title}>{proj.title || 'Project'}</p>
                          {proj.description && (
                            <p className="text-[#A7ADB7] leading-relaxed line-clamp-2">{proj.description}</p>
                          )}
                          {proj.technologies?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {proj.technologies.slice(0, 4).map((t, tIdx) => (
                                <span key={tIdx} className="px-1.5 py-0.5 rounded bg-[#08090B] text-[#A7ADB7] text-[10px]">{t}</span>
                              ))}
                            </div>
                          )}
                          {proj.duration && (
                            <p className="text-[#6F7682] text-[10px]">📅 {proj.duration}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[#F5F5F5] truncate" title={proj}>• {proj}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[#6F7682]">No project items found.</p>
              )}
            </Card>

            {/* Certifications */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2">
                <FaCertificate className="text-[#F5B83D]" size={14} />
                <h3 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Certifications ({parsed.certifications?.length || 0})
                </h3>
              </div>
              {parsed.certifications && parsed.certifications.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-[#A7ADB7]">
                  {parsed.certifications.map((cert, idx) => (
                    <li key={idx} className="truncate" title={cert}>&bull; {cert}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[#6F7682]">No certifications found.</p>
              )}
            </Card>

            {/* Languages */}
            <Card className="p-6 space-y-3 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-2">
                <FaLanguage className="text-[#FFD166]" size={16} />
                <h3 className="text-xs font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                  Languages ({parsed.languages?.length || 0})
                </h3>
              </div>
              {parsed.languages && parsed.languages.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsed.languages.map((lang, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-[#08090B] border border-[#292D33] text-[#F5F5F5] text-[11px] font-semibold rounded-lg">
                      {lang}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#6F7682]">No languages specified.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Raw Extracted Text */}
      {activeTab === 'text' && (
        <Card className="p-6 space-y-4 bg-[#121519] border-[#292D33]">
          <div className="flex items-center justify-between border-b border-[#292D33] pb-4">
            <div className="flex items-center gap-3">
              <FaFileAlt className="text-[#F5B83D]" size={16} />
              <h3 className="text-sm font-extrabold text-[#F5F5F5] uppercase tracking-wider">
                Full Extracted Plain Text
              </h3>
            </div>
            <Button size="sm" variant="outline" icon={<FaCopy size={12} />} onClick={handleCopyText}>
              Copy Text
            </Button>
          </div>

          {resume.parsedText ? (
            <pre className="p-4 bg-[#08090B] border border-[#292D33] rounded-2xl text-xs font-mono text-[#A7ADB7] whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed">
              {resume.parsedText}
            </pre>
          ) : (
            <p className="text-xs text-[#6F7682]">No raw text extracted for this resume document.</p>
          )}
        </Card>
      )}
    </div>
  );
}
