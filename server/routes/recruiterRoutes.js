import express from 'express';
import multer from 'multer';
import upload from '../config/multer.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  rankResumes,
  getRankings,
  getRankingById,
  deleteRanking
} from '../controllers/recruiterController.js';
import ApiError from '../utils/apiError.js';

const router = express.Router();

// Multer middleware wrapper for multiple resumes (up to 30 files in a single batch)
const handleMultipleUploads = (req, res, next) => {
  upload.array('resumes', 30)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, 'One or more resume files exceed the 5MB size limit.'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError(400, 'Maximum of 30 resume files can be uploaded per batch.'));
        }
        return next(new ApiError(400, err.message));
      }
      return next(err);
    }
    next();
  });
};

// All Recruiter Routes are protected with JWT auth and restricted to Admin and Recruiter roles
router.use(authenticateUser);
router.use(authorizeRoles('admin', 'recruiter'));

// Route: Upload multiple resumes and rank candidates against Job Description
router.post('/rank-resumes', handleMultipleUploads, rankResumes);

// Route: Get all ranking sessions
router.get('/rankings', getRankings);

// Route: Get specific ranking session by ID
router.get('/rankings/:id', getRankingById);

// Route: Delete specific ranking session
router.delete('/rankings/:id', deleteRanking);

export default router;
