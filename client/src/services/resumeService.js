import api from './api';

/**
 * Upload resume file (.pdf, .doc, or .docx) with optional upload progress callback
 * @param {FormData} formData 
 * @param {Function} [onProgress] 
 */
export const uploadResume = async (formData, onProgress) => {
  const response = await api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
  return response.data;
};

/**
 * Get list of uploaded resumes for authenticated user
 */
export const getResumes = async () => {
  const response = await api.get('/resumes', {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    params: {
      _t: Date.now()
    }
  });
  return response.data;
};

/**
 * Get details for a specific resume
 * @param {string} id 
 */
export const getResumeById = async (id) => {
  const response = await api.get(`/resumes/${id}`);
  return response.data;
};

/**
 * Delete a resume by ID
 * @param {string} id 
 */
export const deleteResume = async (id) => {
  const response = await api.delete(`/resumes/${id}`);
  return response.data;
};

/**
 * Delete all uploaded resumes for the authenticated user
 */
export const deleteAllResumes = async () => {
  const response = await api.delete('/resumes/all');
  return response.data;
};

/**
 * Delete multiple selected resumes by ID array
 * @param {string[]} ids
 */
export const deleteBulkResumes = async (ids) => {
  const response = await api.delete('/resumes/bulk', { data: { ids } });
  return response.data;
};

/**
 * Trigger or re-run resume text and candidate parsing
 * @param {string} id 
 * @param {boolean} [force] 
 */
export const parseResume = async (id, force = false) => {
  const response = await api.post(`/resumes/${id}/parse`, { force });
  return response.data;
};

/**
 * Get parsed candidate details for a resume
 * @param {string} id 
 */
export const getParsedResume = async (id) => {
  const response = await api.get(`/resumes/${id}/parsed`);
  return response.data;
};

/**
 * Get extracted raw text for a resume
 * @param {string} id 
 */
export const getResumeText = async (id) => {
  const response = await api.get(`/resumes/${id}/text`);
  return response.data;
};

/**
 * Trigger ATS resume evaluation scoring engine (0-100)
 * @param {string} id 
 * @param {boolean} [force] 
 */
export const analyzeResume = async (id, force = false) => {
  const response = await api.post(`/resumes/${id}/analyze`, { force });
  return response.data;
};

/**
 * Get cached ATS evaluation report for a resume
 * @param {string} id 
 */
export const getResumeAnalysis = async (id) => {
  const response = await api.get(`/resumes/${id}/analysis`);
  return response.data;
};

/**
 * Get complete analysis (Resume + ATS + AI) in a single request
 * @param {string} id 
 */
export const getCompleteResumeAnalysis = async (id) => {
  const response = await api.get(`/resumes/${id}/complete-analysis`);
  return response.data;
};

/**
 * Trigger automated full pipeline analysis (Parsing -> ATS -> AI)
 * @param {string} id 
 * @param {boolean} [force]
 */
export const autoAnalyzeResume = async (id, force = false) => {
  const response = await api.post(`/resumes/${id}/auto-analyze`, { force });
  return response.data;
};

