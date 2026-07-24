import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  analyzeResumeWithAI,
  getAIAnalysisReport,
  getAIAnalysisHistory,
  improveFullResume,
  rewriteSummary,
  rewriteProject,
  rewriteExperience,
  getResumeImprovements
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

// Phase 12 AI Improvement Routes
router.post('/improve/:resumeId', improveFullResume);
router.post('/rewrite-summary', rewriteSummary);
router.post('/rewrite-project', rewriteProject);
router.post('/rewrite-experience', rewriteExperience);
router.get('/improvements/:resumeId', getResumeImprovements);

export default router;
