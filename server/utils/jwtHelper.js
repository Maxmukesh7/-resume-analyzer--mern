import jwt from 'jsonwebtoken';

/**
 * Generates a short-lived access JWT token.
 * @param {Object} user - The user instance payload.
 * @returns {String} - Signed JWT token.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

/**
 * Generates a long-lived refresh JWT token.
 * @param {Object} user - The user instance payload.
 * @returns {String} - Signed JWT token.
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Verifies the validity of an access token.
 * @param {String} token - The signed JWT access token.
 * @returns {Object} - Parsed token payload.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verifies the validity of a refresh token.
 * @param {String} token - The signed JWT refresh token.
 * @returns {Object} - Parsed token payload.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_SECRET);
};
