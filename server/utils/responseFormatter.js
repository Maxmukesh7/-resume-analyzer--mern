/**
 * Utility to format standard JSON response bodies.
 * @param {boolean} success - Flag indicating operation success.
 * @param {string} message - Descriptive text message.
 * @param {Object|Array|null} data - Payload data.
 * @param {Object|null} extra - Additional keys.
 * @returns {Object} - Formatted response object.
 */
export const formatResponse = (success, message = '', data = null, extra = {}) => {
  return {
    success,
    message,
    data,
    ...extra,
    timestamp: new Date().toISOString()
  };
};

export const formatErrorResponse = (message = 'An error occurred', errors = [], stack = null) => {
  const errRes = {
    success: false,
    message,
    errors
  };

  if (stack && process.env.NODE_ENV !== 'production') {
    errRes.stack = stack;
  }

  return errRes;
};
