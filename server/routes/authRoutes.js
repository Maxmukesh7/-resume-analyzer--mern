import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  googleLogin,
  logout, 
  getProfile, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword,
  refresh
} from '../controllers/authController.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: Register User
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password')
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })
      .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password does not match.');
      }
      return true;
    })
  ],
  validateRequest,
  register
);

// Route: Login User
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validateRequest,
  login
);

// Route: Google OAuth Login / Register
router.post('/google', googleLogin);

// Route: Logout User
router.post('/logout', logout);

// Route: Silent Token Refresh
router.post('/refresh', refresh);

// Route: Get Profile (Protected)
router.get('/profile', authenticateUser, getProfile);

// Route: Update Profile (Protected)
router.put(
  '/profile',
  authenticateUser,
  [
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty.'),
    body('phone').optional().trim().isMobilePhone().withMessage('Enter a valid phone number.')
  ],
  validateRequest,
  updateProfile
);

// Route: Change Password (Protected)
router.put(
  '/change-password',
  authenticateUser,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })
      .withMessage('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirm password does not match.');
      }
      return true;
    })
  ],
  validateRequest,
  changePassword
);

// Route: Forgot Password (intact)
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Enter a valid email address.')
  ],
  validateRequest,
  forgotPassword
);

// Route: Reset Password (intact)
router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
  ],
  validateRequest,
  resetPassword
);

export default router;
