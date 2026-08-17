import express from 'express';
import multer from 'multer';
import upload from '../config/multer.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  uploadResume,
  getResumes,
  getResumeDetails,
  deleteResume,
  parseResume,
  getParsedResume,
  getResumeText,
  analyzeResume,
  getResumeAnalysis,
  getCompleteResumeAnalysis,
  autoAnalyzeResume
} from '../controllers/resumeController.js';
import ApiError from '../utils/apiError.js';

const router = express.Router();

// Middleware wrapper for multer upload error handling
const handleUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, 'File size exceeds maximum limit of 5MB.'));
        }
        return next(new ApiError(400, err.message));
      }
      return next(err);
    }
    next();
  });
};

// All resume routes are protected with JWT auth middleware
router.use(authenticateUser);

// Route: Upload single resume file
router.post('/', handleUpload, uploadResume);
router.post('/upload', handleUpload, uploadResume);

// Route: Get all resumes for authenticated user
router.get('/', getResumes);

// Route: Get Complete Resume Analysis (Resume + ATS + AI)
router.get('/:id/complete-analysis', getCompleteResumeAnalysis);

// Route: Automated end-to-end analysis pipeline trigger
router.post('/:id/auto-analyze', autoAnalyzeResume);

// Route: Get Resume details by ID
router.get('/:id', getResumeDetails);

// Route: Delete Resume by ID
router.delete('/:id', deleteResume);

// Route: Trigger/Re-run Resume parsing
router.post('/:id/parse', parseResume);

// Route: Get Parsed Candidate details
router.get('/:id/parsed', getParsedResume);

// Route: Get Raw Extracted Resume text
router.get('/:id/text', getResumeText);

// Route: Analyze Resume with ATS Engine
router.post('/:id/analyze', analyzeResume);

// Route: Get ATS Analysis Report
router.get('/:id/analysis', getResumeAnalysis);

export default router;

