import api from './api';

export const recruiterService = {
  /**
   * Upload multiple resumes and rank candidates against a Job Description
   * @param {FormData} formData - Contains resumes[], jobTitle, companyName, jobDescription, weights
   * @param {Function} [onUploadProgress] - Upload progress callback
   */
  rankResumes: async (formData, onUploadProgress) => {
    const res = await api.post('/recruiter/rank-resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      }
    });
    return res.data;
  },

  /**
   * Get past ranking sessions with pagination and search
   */
  getRankings: async (params = {}) => {
    const res = await api.get('/recruiter/rankings', { params });
    return res.data;
  },

  /**
   * Get single ranking session details by ID
   */
  getRankingById: async (id) => {
    const res = await api.get(`/recruiter/rankings/${id}`);
    return res.data;
  },

  /**
   * Delete a ranking session by ID
   */
  deleteRanking: async (id) => {
    const res = await api.delete(`/recruiter/rankings/${id}`);
    return res.data;
  }
};

export default recruiterService;
