import express from 'express';
import multer from 'multer';
import upload from '../config/multer.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  uploadResume,
  getResumes,
  getResumeDetails,
  deleteResume
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
router.post('/upload', handleUpload, uploadResume);

// Route: Get all resumes for authenticated user
router.get('/', getResumes);

// Route: Get Resume details by ID
router.get('/:id', getResumeDetails);

// Route: Delete Resume by ID
router.delete('/:id', deleteResume);

export default router;
