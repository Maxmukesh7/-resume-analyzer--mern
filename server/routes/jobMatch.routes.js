import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  analyzeJobMatch,
  getJobMatchHistory,
  getJobMatchById,
  deleteJobMatch
} from '../controllers/jobMatch.controller.js';

const router = express.Router();

// Protected by JWT Auth
router.use(authenticateUser);

// Route: Analyze resume vs Job Description
router.post('/analyze', analyzeJobMatch);

// Route: Get user's job match history
router.get('/history', getJobMatchHistory);

// Route: Get specific job match report details by ID
router.get('/:id', getJobMatchById);

// Route: Delete a job match report by ID
router.delete('/:id', deleteJobMatch);

export default router;
