import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get administrative system analytics
 * @route   GET /api/admin/stats
 * @access  Private/Admin (Mocked)
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const dummyAdminStats = {
    systemHealth: 'Healthy',
    totalRegisteredUsers: 1420,
    totalScansProcessed: 8945,
    averageSystemAtsScore: 74.8,
    activeSubscribers: 312,
    serviceLoad: '12%',
    uptime: '99.98%'
  };

  return successResponse(res, dummyAdminStats, 'Admin administrative dashboard metrics fetched successfully.');
});
