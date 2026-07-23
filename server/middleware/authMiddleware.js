import { verifyAccessToken } from '../utils/jwtHelper.js';
import User from '../models/User.js';
import { unauthorizedError, forbiddenError } from '../utils/apiError.js';
import asyncHandler from './asyncHandler.js';

/**
 * Middleware to authenticate requests via JWT tokens in headers or cookies.
 */
export const authenticateUser = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check authorization headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback to access cookie
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw unauthorizedError('Access denied. Authentication token is missing.');
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // Retrieve user profile (omitting password hashing fields)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw unauthorizedError('Access denied. User profile no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    throw unauthorizedError('Access denied. Session has expired or token is invalid.');
  }
});

/**
 * Middleware to restrict route access based on user role enums.
 * @param {...String} roles - Allowed role names.
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw forbiddenError('Access denied. You do not have permission to perform this action.');
    }
    next();
  };
};
