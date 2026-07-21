import express from 'express';
import { getHistory, getResumeDetails, deleteResume } from '../controllers/resumeController.js';

const router = express.Router();

// Route: Get History list
router.get('/history', getHistory);

// Route: Get Details by ID
router.get('/:id', getResumeDetails);

// Route: Delete entry by ID
router.delete('/:id', deleteResume);

export default router;
