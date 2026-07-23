import api from './api';

/**
 * Trigger Job Description Match Analysis against uploaded resume
 * @param {Object} data - { resumeId, jobTitle, companyName, jobDescription, force }
 */
export const analyzeJobMatch = async (data) => {
  const response = await api.post('/job-match/analyze', data);
  return response.data;
};

/**
 * Get user's job match analysis history list
 * @param {string} [search] 
 */
export const getJobMatchHistory = async (search = '') => {
  const response = await api.get('/job-match/history', {
    params: { search, _t: Date.now() }
  });
  return response.data;
};

/**
 * Get specific job match report details by ID
 * @param {string} id 
 */
export const getJobMatchById = async (id) => {
  const response = await api.get(`/job-match/${id}`);
  return response.data;
};

/**
 * Delete a job match analysis record by ID
 * @param {string} id 
 */
export const deleteJobMatch = async (id) => {
  const response = await api.delete(`/job-match/${id}`);
  return response.data;
};
