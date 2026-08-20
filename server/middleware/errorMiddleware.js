import { formatErrorResponse } from '../utils/responseFormatter.js';
import ApiError from '../utils/apiError.js';

/**
 * Middleware to handle 404 (Not Found) routes.
 * Creates an ApiError and passes it forward.
 */
export const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Global error handler middleware.
 * Formats standard error responses and maps common database errors to readable JSON messages.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  console.error('💥 [DEBUG] Error handled by global handler:', {
    statusCode,
    message,
    errors,
    stack: err.stack
  });

  // Catch Mongoose invalid ObjectId CastError
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid resource ID format';
  }

  // Catch Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
  }

  // Catch duplicate key errors (MongoDB indexing)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate database resource field value entered';
  }

  // Catch Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum allowed size is 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected upload field "${err.field}".`;
    } else {
      message = err.message || 'File upload failed.';
    }
  }

  // Log server errors (5xx codes) for visibility
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${err.message}\nStack: ${err.stack}`);
  }

  res.status(statusCode).json(
    formatErrorResponse(message, errors, err.stack)
  );
};
