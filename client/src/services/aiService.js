import api from './api';

/**
 * Trigger Google Gemini AI resume analysis
 * @param {string} resumeId 
 * @param {boolean} [force] 
 */
export const analyzeResumeWithAI = async (resumeId, force = false) => {
  const response = await api.post(`/ai/analyze/${resumeId}`, { force });
  return response.data;
};

/**
 * Get stored AI analysis report for a resume
 * @param {string} resumeId 
 */
export const getAIAnalysisReport = async (resumeId) => {
  const response = await api.get(`/ai/report/${resumeId}`);
  return response.data;
};

/**
 * Get user's AI analysis history
 */
export const getAIAnalysisHistory = async () => {
  const response = await api.get('/ai/history');
  return response.data;
};

/**
 * Trigger full AI Resume Improvement optimization
 * @param {string} resumeId 
 * @param {Object} [payload] 
 */
export const improveFullResume = async (resumeId, payload = {}) => {
  const response = await api.post(`/ai/improve/${resumeId}`, payload);
  return response.data;
};

/**
 * Standalone AI Professional Summary Rewriter
 * @param {Object} payload 
 */
export const rewriteSummary = async (payload = {}) => {
  const response = await api.post('/ai/rewrite-summary', payload);
  return response.data;
};

/**
 * Standalone AI Project Enhancer
 * @param {Object} payload 
 */
export const rewriteProject = async (payload = {}) => {
  const response = await api.post('/ai/rewrite-project', payload);
  return response.data;
};

/**
 * Standalone AI Experience Enhancer
 * @param {Object} payload 
 */
export const rewriteExperience = async (payload = {}) => {
  const response = await api.post('/ai/rewrite-experience', payload);
  return response.data;
};

/**
 * Get stored AI Resume Improvements from MongoDB
 * @param {string} resumeId 
 */
export const getResumeImprovements = async (resumeId) => {
  const response = await api.get(`/ai/improvements/${resumeId}`);
  return response.data;
};
