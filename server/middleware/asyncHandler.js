/**
 * Async handler middleware to wrap controllers and eliminate boilerplate try/catch blocks.
 * @param {Function} fn - Asynchronous Express route handler function.
 * @returns {Function} - Express middleware function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
