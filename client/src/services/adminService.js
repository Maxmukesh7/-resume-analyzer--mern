import api from './api';

export const adminService = {
  // Dashboard & Metrics
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  // User Management
  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  getUserById: async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  updateUserRole: async (id, role) => {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  updateUserStatus: async (id, isActive) => {
    const res = await api.patch(`/admin/users/${id}/status`, { isActive });
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  // Resume Management
  getResumes: async (params = {}) => {
    const res = await api.get('/admin/resumes', { params });
    return res.data;
  },

  getResumeById: async (id) => {
    const res = await api.get(`/admin/resumes/${id}`);
    return res.data;
  },

  deleteResume: async (id) => {
    const res = await api.delete(`/admin/resumes/${id}`);
    return res.data;
  },

  // Analytics, Activity & Health
  getAnalytics: async (params = {}) => {
    const res = await api.get('/admin/analytics', { params });
    return res.data;
  },

  getActivity: async (params = {}) => {
    const res = await api.get('/admin/activity', { params });
    return res.data;
  },

  getHealth: async () => {
    const res = await api.get('/admin/health');
    return res.data;
  },

  getNotifications: async () => {
    const res = await api.get('/admin/notifications');
    return res.data;
  }
};

export default adminService;
