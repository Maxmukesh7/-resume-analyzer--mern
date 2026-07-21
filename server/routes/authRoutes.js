import express from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Route: Register User
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name field is required.'),
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
  ],
  validateRequest,
  register
);

// Route: Login User
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validateRequest,
  login
);

// Route: Forgot Password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Enter a valid email address.')
  ],
  validateRequest,
  forgotPassword
);

// Route: Reset Password
router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
  ],
  validateRequest,
  resetPassword
);

export default router;
