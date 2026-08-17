import express from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: Get user dashboard stats (protected)
router.get('/stats', authenticateUser, getStats);

export default router;
