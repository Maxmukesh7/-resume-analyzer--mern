import { verifyAccessToken } from '../utils/jwtHelper.js';
import User from '../models/User.js';
import { unauthorizedError, forbiddenError } from '../utils/apiError.js';
import asyncHandler from './asyncHandler.js';

/**
 * Middleware to verify JWT authentication and restrict access strictly to Admin users.
 * Responds with 403 Forbidden for non-admin users or 401 Unauthorized for invalid/missing token.
 */
export const adminMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check authorization headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback to access token cookie
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw unauthorizedError('Access denied. Authentication token is missing.');
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // Retrieve user profile
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw unauthorizedError('Access denied. User profile no longer exists.');
    }

    if (user.isActive === false) {
      throw forbiddenError('Access denied. Your account is deactivated.');
    }

    // Verify user role is 'admin'
    if (user.role !== 'admin') {
      throw forbiddenError('Access denied. Administrator privileges are required.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw unauthorizedError('Access denied. Session has expired or token is invalid.');
  }
});

export default adminMiddleware;
