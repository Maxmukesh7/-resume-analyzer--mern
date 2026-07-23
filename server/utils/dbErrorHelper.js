import ApiError from './apiError.js';

/**
 * Maps Mongoose/MongoDB database exceptions to structured ApiError exceptions.
 * @param {Error} err - The raw database error.
 * @returns {ApiError} - Structured API exception.
 */
export const handleDbError = (err) => {
  if (err instanceof ApiError) return err;

  let statusCode = 500;
  let message = err.message || 'Database error occurred';
  let errors = [];

  // Mongoose invalid ObjectId CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid parameter type for field: ${err.path}. Value: ${err.value}`;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database schema validation failed.';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
  }

  // MongoDB duplicate index key errors (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyValue)[0];
    message = `Duplicate resource entry. The value for '${duplicateField}' is already in use.`;
    errors = [{
      field: duplicateField,
      message: `'${duplicateField}' must be unique.`
    }];
  }

  return new ApiError(statusCode, message, errors, err.stack);
};
