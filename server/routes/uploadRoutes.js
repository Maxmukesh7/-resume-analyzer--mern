import express from 'express';
import upload from '../config/multer.js';
import { uploadResume } from '../controllers/uploadController.js';

const router = express.Router();

// Route: Upload single file (name field: 'resume')
router.post('/', upload.single('resume'), uploadResume);

export default router;
