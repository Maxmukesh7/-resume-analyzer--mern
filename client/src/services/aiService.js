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
