import express from 'express';
import { body } from 'express-validator';
import { analyzeResume, getAtsReport } from '../controllers/analysisController.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Route: Trigger scan analysis
router.post(
  '/scan',
  [
    body('resumeId').notEmpty().withMessage('Resume ID parameter is required to initiate scan.')
  ],
  validateRequest,
  analyzeResume
);

// Route: Get Report details by resume ID
router.get('/report/:id', getAtsReport);

export default router;
