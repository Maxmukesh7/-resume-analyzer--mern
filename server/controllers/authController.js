import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // Placeholder database check & creation goes here in Phase 5
  return successResponse(res, { name, email }, 'Registration working successfully. Account created.', 201);
});

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // Placeholder user validation & JWT creation goes here in Phase 5
  return successResponse(res, { email, token: 'dummy-jwt-token' }, 'Authentication working successfully. Logged in.');
});

/**
 * @desc    Request a password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // Placeholder reset link sender goes here in Phase 5
  return successResponse(res, null, `Password reset email successfully sent to ${email}`);
});

/**
 * @desc    Reset password using a token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  // Placeholder reset token handler goes here in Phase 5
  return successResponse(res, null, `Password reset successfully using token: ${token}`);
});
