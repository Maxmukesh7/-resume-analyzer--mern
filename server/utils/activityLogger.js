import ActivityLog from '../models/ActivityLog.js';

/**
 * Utility helper to record user and system activities asynchronously.
 * 
 * @param {Object} params
 * @param {String|mongoose.Types.ObjectId} [params.userId] - ID of user performing the action
 * @param {String} params.action - Short title of action (e.g., 'User Registered', 'Resume Uploaded')
 * @param {String} [params.description] - Additional context description
 * @param {Object} [params.req] - Express request object for IP and User-Agent parsing
 */
export const logActivity = async ({ userId = null, action, description = '', req = null }) => {
  try {
    let ipAddress = '';
    let device = '';

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
      device = req.headers['user-agent'] || '';
    }

    await ActivityLog.create({
      user: userId,
      action,
      description,
      ipAddress,
      device
    });
  } catch (error) {
    console.error('⚠️ [ActivityLogger] Failed to write activity log:', error.message);
  }
};

export default logActivity;
