import { validationResult } from 'express-validator';
import { badRequestError } from '../utils/apiError.js';

/**
 * Middleware to check express-validator validation results.
 * If errors are found, formats them and calls the global error handler with a BadRequest exception.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    console.warn('❌ [DEBUG] Request validation failed. Errors:', formattedErrors);
    return next(badRequestError('Request validation failed', formattedErrors));
  }
  next();
};
