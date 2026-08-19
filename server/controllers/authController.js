import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtHelper.js';
import { formatMongoDoc } from '../utils/dbFormatter.js';

import logActivity from '../utils/activityLogger.js';

/**
 * Generates secure HTTP cookie options tailored for both single-origin
 * and cross-origin production environments (Render, Vercel, Netlify).
 * When running over HTTPS or in production, 'sameSite: none' with 'secure: true'
 * allows cookies to be sent across different origins safely.
 */
export const getAuthCookieOptions = (req) => {
  const isSecure =
    process.env.NODE_ENV === 'production' ||
    Boolean(req?.secure) ||
    req?.headers?.['x-forwarded-proto'] === 'https';

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
};

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  console.log('📥 [DEBUG] Incoming Registration Request Body:', req.body);
  const { fullName, email, password } = req.body;

  // Prevent duplicate emails
  const dbState = mongoose.connection.readyState;
  const stateLabels = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
  console.log(`🔌 [DEBUG] Mongoose connection state before User.findOne(): readyState = ${dbState} (${stateLabels[dbState] || 'Unknown'})`);

  if (dbState !== 1) {
    console.error(`💥 [DEBUG] Mongoose is not connected! State: ${dbState} (${stateLabels[dbState] || 'Unknown'})`);
    throw new ApiError(503, `Database connection is not ready (state: ${stateLabels[dbState] || dbState}). Please try again.`);
  }

  console.log('🔍 [DEBUG] Checking if email already exists:', email);
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.warn('⚠️ [DEBUG] Duplicate email warning:', email);
    throw new ApiError(409, 'A user with this email address already exists.');
  }

  // Create User (password gets hashed pre-save in User model)
  console.log('💾 [DEBUG] Creating user in MongoDB...');
  const user = await User.create({
    fullName,
    email,
    password
  });
  console.log('✅ [DEBUG] User created & saved successfully in MongoDB:', user._id);

  await logActivity({
    userId: user._id,
    action: 'New User Registered',
    description: `User ${user.fullName} (${user.email}) registered an account.`,
    req
  });

  // Generate tokens
  console.log('🔑 [DEBUG] Generating JWT access and refresh tokens...');
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  console.log('🔑 [DEBUG] Tokens generated successfully.');

  // Set HTTP-Only refresh cookie with dynamic environment options
  res.cookie('refreshToken', refreshToken, getAuthCookieOptions(req));

  console.log('📤 [DEBUG] Sending successful 201 response...');
  return successResponse(
    res,
    {
      user: formatMongoDoc(user),
      token: accessToken,
      expiresIn: 15 * 60 // 15 mins (in seconds)
    },
    'User registered successfully.',
    201
  );
});

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const dbState = mongoose.connection.readyState;
  const stateLabels = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
  console.log(`🔌 [DEBUG] Mongoose connection state before User.findOne(): readyState = ${dbState} (${stateLabels[dbState] || 'Unknown'})`);

  if (dbState !== 1) {
    console.error(`💥 [DEBUG] Mongoose is not connected! State: ${dbState} (${stateLabels[dbState] || 'Unknown'})`);
    throw new ApiError(503, `Database connection is not ready (state: ${stateLabels[dbState] || dbState}). Please try again.`);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.isActive === false) {
    throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
  }

  // Check password match
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set HTTP-Only refresh cookie with dynamic environment options
  res.cookie('refreshToken', refreshToken, getAuthCookieOptions(req));

  await logActivity({
    userId: user._id,
    action: 'User Logged In',
    description: `User ${user.fullName} logged in.`,
    req
  });

  return successResponse(
    res,
    {
      user: formatMongoDoc(user),
      token: accessToken,
      expiresIn: 15 * 60 // 15 mins
    },
    'Logged in successfully.'
  );
});

/**
 * @desc    Log out user and clear cookies
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  const cookieOpts = getAuthCookieOptions(req);
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: '/'
  });
  return successResponse(res, null, 'Logged out successfully.');
});

/**
 * @desc    Get current user profile details
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  // User is attached to req by authenticateUser middleware (password already excluded)
  return successResponse(res, formatMongoDoc(req.user), 'User profile fetched successfully.');
});

/**
 * @desc    Update user profile credentials
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;

  const updatedUser = await user.save();

  return successResponse(
    res,
    formatMongoDoc(updatedUser),
    'Profile credentials updated successfully.'
  );
});

/**
 * @desc    Change user account password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect.');
  }

  // Update password (triggers hashing in pre-save hook)
  user.password = newPassword;
  await user.save();

  return successResponse(res, null, 'Password updated successfully.');
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

/**
 * @desc    Refresh access token using refresh token cookie
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new ApiError(401, 'Session expired. Authentication token is missing.');
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new ApiError(401, 'User no longer exists.');
    }

    const accessToken = generateAccessToken(user);
    
    return successResponse(
      res,
      {
        token: accessToken,
        expiresIn: 15 * 60
      },
      'Access token refreshed successfully.'
    );
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }
});
