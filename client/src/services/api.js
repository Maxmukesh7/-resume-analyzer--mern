import axios from 'axios';

/**
 * Dynamically resolves and normalizes the backend API base URL:
 * - If VITE_API_URL is configured (e.g. 'https://backend.onrender.com' or 'https://backend.onrender.com/api'):
 *   Normalizes it to ensure '/api' suffix without trailing slashes.
 * - In single-service Render deployments or when omitted:
 *   Defaults to relative '/api' so requests route directly to the serving backend.
 */
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    return '/api';
  }

  const trimmed = envUrl.trim().replace(/\/+$/, '');
  
  // If an absolute URL was provided without the /api prefix, automatically append it
  if (/^https?:\/\//i.test(trimmed) && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }

  return trimmed;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle expired tokens and automatically refresh sessions
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger silent refresh if access token expired (401 Unauthorized)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const base = (api.defaults.baseURL || '/api').replace(/\/+$/, '');
        const response = await axios.post(
          `${base}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { token } = response.data.data;
        localStorage.setItem('token', token);

        // Retry original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear local storage if refresh fails (i.e. refresh session also expired)
        localStorage.removeItem('token');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
