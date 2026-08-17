import express from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getAdminResumes,
  getAdminResumeById,
  deleteAdminResume,
  getAdminAnalytics,
  getAdminActivity,
  getAdminHealth,
  getAdminNotifications
} from '../controllers/adminController.js';

const router = express.Router();

// Apply adminMiddleware across all admin routes
router.use(adminMiddleware);

// Dashboard & Metrics
router.get('/dashboard', getAdminDashboard);
router.get('/stats', getAdminDashboard); // Backward compatibility alias

// User Management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Resume Management
router.get('/resumes', getAdminResumes);
router.get('/resumes/:id', getAdminResumeById);
router.delete('/resumes/:id', deleteAdminResume);

// Analytics, Feed & Diagnostics
router.get('/analytics', getAdminAnalytics);
router.get('/activity', getAdminActivity);
router.get('/health', getAdminHealth);
router.get('/notifications', getAdminNotifications);

export default router;
