import express from 'express';
import { getAdminStats } from '../controllers/adminController.js';

const router = express.Router();

// Route: Get administrative logs and statistics
router.get('/stats', getAdminStats);

export default router;
