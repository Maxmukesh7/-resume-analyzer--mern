import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  analyzeResumeWithAI,
  getAIAnalysisReport,
  getAIAnalysisHistory
} from '../controllers/aiController.js';

const router = express.Router();

// All AI routes are protected with JWT auth middleware
router.use(authenticateUser);

// Route: Analyze resume with Google Gemini AI
router.post('/analyze/:resumeId', analyzeResumeWithAI);

// Route: Get stored AI analysis report for a resume
router.get('/report/:resumeId', getAIAnalysisReport);

// Route: Get user's AI analysis history list
router.get('/history', getAIAnalysisHistory);

export default router;
