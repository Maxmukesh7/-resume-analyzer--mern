import express from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile, updateSettings } from '../controllers/userController.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Route: Get Profile Details
router.get('/profile', getProfile);

// Route: Update Profile Data
router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('email').optional().isEmail().withMessage('Enter a valid email address.')
  ],
  validateRequest,
  updateProfile
);

// Route: Update Account Settings
router.put('/settings', updateSettings);

export default router;
