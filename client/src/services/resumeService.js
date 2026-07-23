import api from './api';

/**
 * Upload resume file (.pdf or .docx) with optional upload progress callback
 * @param {FormData} formData 
 * @param {Function} [onProgress] 
 */
export const uploadResume = async (formData, onProgress) => {
  const response = await api.post('/resume/upload', formData, {
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
  const response = await api.get('/resume');
  return response.data;
};

/**
 * Get details for a specific resume
 * @param {string} id 
 */
export const getResumeById = async (id) => {
  const response = await api.get(`/resume/${id}`);
  return response.data;
};

/**
 * Delete a resume by ID
 * @param {string} id 
 */
export const deleteResume = async (id) => {
  const response = await api.delete(`/resume/${id}`);
  return response.data;
};
