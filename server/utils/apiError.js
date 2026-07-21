class ApiError extends Error {
  constructor(statusCode, message = 'Internal Server Error', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
export const badRequestError = (message = 'Bad Request', errors = []) => {
  return new ApiError(400, message, errors);
};
export const unauthorizedError = (message = 'Unauthorized access') => {
  return new ApiError(401, message);
};
export const forbiddenError = (message = 'Forbidden access') => {
  return new ApiError(403, message);
};
export const notFoundError = (message = 'Resource not found') => {
  return new ApiError(404, message);
};
export const internalServerError = (message = 'Internal server error') => {
  return new ApiError(500, message);
};
