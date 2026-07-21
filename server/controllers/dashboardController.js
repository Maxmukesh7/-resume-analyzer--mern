import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get dashboard metrics, statistics, and trends
 * @route   GET /api/dashboard/stats
 * @access  Private (Mocked)
 */
export const getStats = asyncHandler(async (req, res) => {
  const dummyStats = {
    totalUploads: 14,
    averageAtsScore: 78,
    highestAtsScore: 92,
    applicationsSent: 8,
    scoreHistory: [
      { name: 'Jan', score: 65 },
      { name: 'Feb', score: 70 },
      { name: 'Mar', score: 72 },
      { name: 'Apr', score: 78 },
      { name: 'May', score: 85 },
      { name: 'Jun', score: 92 }
    ],
    categoryScores: [
      { name: 'Keywords', score: 82 },
      { name: 'Formatting', score: 90 },
      { name: 'Experience', score: 75 },
      { name: 'Skills', score: 85 },
      { name: 'Education', score: 60 }
    ]
  };

  return successResponse(res, dummyStats, 'Dashboard stats fetched successfully.');
});
