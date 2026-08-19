import axios from 'axios';

/**
 * Dynamically resolves and normalizes the backend API base URL:
 * - If running in browser on a remote production domain (e.g. *.onrender.com, *.vercel.app, custom domain)
 *   and VITE_API_URL accidentally has localhost/127.0.0.1 from a local build,
 *   it ignores the localhost leak and falls back safely to relative '/api' (same-origin).
 * - If VITE_API_URL is configured with a valid remote domain (e.g. 'https://backend.onrender.com' or 'https://backend.onrender.com/api'):
 *   Normalizes it to ensure '/api' suffix without trailing slashes.
 * - In single-service Render deployments or when omitted:
 *   Defaults to relative '/api' so requests route directly to the serving backend.
 */
export const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isBrowser = typeof window !== 'undefined' && Boolean(window.location);
  const isLocalhostHost = isBrowser && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0'
  );

  // If no env URL is provided, default to relative '/api'
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    return '/api';
  }

  const trimmed = envUrl.trim().replace(/\/+$/, '');

  // Guard against development localhost leaks in production builds:
  // If the website is loaded from a real remote domain (like *.onrender.com or custom domain),
  // but envUrl points to localhost/127.0.0.1, ignore the leaked local URL and use relative '/api'
  if (
    isBrowser &&
    !isLocalhostHost &&
    (trimmed.includes('localhost') || trimmed.includes('127.0.0.1') || trimmed.includes('0.0.0.0'))
  ) {
    console.warn(
      '⚠️ [API] Detected localhost VITE_API_URL in production environment. Falling back to relative "/api" route.'
    );
    return '/api';
  }

  // If an absolute URL was provided without the /api prefix, automatically append it
  if (/^https?:\/\//i.test(trimmed) && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }

  return trimmed;
};

/**
 * Resolves static media and resume file download URLs.
 * Handles both relative same-origin routes and separate remote backend origins.
 * @param {string} filePath - Upload relative path (e.g. 'uploads/resumes/example.pdf')
 * @returns {string} Fully qualified or relative URL to the asset
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const cleanPath = filePath.replace(/^\/+/, '');
  const base = getBaseURL();

  if (/^https?:\/\//i.test(base)) {
    // Cross-origin: strip trailing '/api' from base URL to get backend origin
    const backendRoot = base.replace(/\/api\/?$/i, '');
    return `${backendRoot}/${cleanPath}`;
  }

  return `/${cleanPath}`;
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

// Interceptor to handle expired tokens, diagnose HTML responses, and automatically refresh sessions
api.interceptors.response.use(
  (response) => {
    // Diagnostic check: If an API endpoint returned HTML instead of JSON (common if frontend proxy missing or misrouted)
    if (
      typeof response.data === 'string' &&
      (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html')) &&
      response.config?.url?.startsWith('/')
    ) {
      console.warn(
        '⚠️ [API Warning] Endpoint returned HTML instead of API JSON data. ' +
        'If frontend and backend are deployed on separate services, ' +
        'ensure VITE_API_URL is set in your frontend hosting dashboard (e.g. Render/Vercel).'
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log diagnostic information on network/CORS failure
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error(
        '🌐 [Network/CORS Error] Failed to connect to backend API.\n' +
        `Target Base URL: "${api.defaults.baseURL || getBaseURL()}"\n` +
        `Request URL: "${originalRequest?.url}"\n` +
        'Troubleshooting Checklist:\n' +
        '1. Ensure the backend service is running and healthy at /api/health\n' +
        '2. Verify CORS_ORIGIN on the backend includes the frontend domain\n' +
        '3. If deployed on Render/Vercel, check that VITE_API_URL was set during frontend build'
      );
    }

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
        const base = (api.defaults.baseURL || getBaseURL()).replace(/\/+$/, '');
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
