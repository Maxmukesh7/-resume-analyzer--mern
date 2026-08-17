import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import JobMatch from '../models/JobMatch.js';

/**
 * @desc    Get real user dashboard metrics, statistics, and trends from MongoDB
 * @route   GET /api/dashboard/stats
 * @access  Private / Optional Auth
 */
export const getStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return successResponse(
      res,
      {
        totalUploads: 0,
        averageAtsScore: 0,
        highestAtsScore: 0,
        applicationsSent: 0,
        scoreHistory: [],
        categoryScores: [
          { name: 'Keywords', score: 0 },
          { name: 'Formatting', score: 0 },
          { name: 'Experience', score: 0 },
          { name: 'Skills', score: 0 },
          { name: 'Education', score: 0 }
        ]
      },
      'Dashboard stats fetched successfully.'
    );
  }

  // 1. Total resumes uploaded by user
  const totalUploads = await Resume.countDocuments({ user: userId });

  // 2. Total job match checks performed
  const jobMatchesCount = await JobMatch.countDocuments({ userId });

  // 3. User's ATS analysis records
  const analyses = await ResumeAnalysis.find({ userId })
    .sort({ createdAt: 1 })
    .lean();

  let averageAtsScore = 0;
  let highestAtsScore = 0;
  let scoreHistory = [];
  let categoryScores = [
    { name: 'Keywords', score: 0 },
    { name: 'Formatting', score: 0 },
    { name: 'Experience', score: 0 },
    { name: 'Skills', score: 0 },
    { name: 'Education', score: 0 }
  ];

  if (analyses.length > 0) {
    const scores = analyses.map((a) => a.overallScore || 0);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    averageAtsScore = Math.round(sum / scores.length);
    highestAtsScore = Math.max(...scores);

    // Build timeline score history
    scoreHistory = analyses.slice(-6).map((a) => {
      const date = a.createdAt ? new Date(a.createdAt) : new Date();
      const monthName = date.toLocaleString('default', { month: 'short' });
      return {
        name: monthName,
        score: a.overallScore || 0
      };
    });

    // Average category metrics or extract from most recent analysis
    const latestAnalysis = analyses[analyses.length - 1];
    if (latestAnalysis.sectionScores) {
      categoryScores = [
        { name: 'Keywords', score: latestAnalysis.sectionScores.keywordScore || 0 },
        { name: 'Formatting', score: latestAnalysis.sectionScores.formattingScore || 0 },
        { name: 'Experience', score: latestAnalysis.sectionScores.experienceScore || 0 },
        { name: 'Skills', score: latestAnalysis.sectionScores.skillsScore || 0 },
        { name: 'Education', score: latestAnalysis.sectionScores.educationScore || 0 }
      ];
    }
  }

  const stats = {
    totalUploads,
    averageAtsScore,
    highestAtsScore,
    applicationsSent: jobMatchesCount,
    scoreHistory,
    categoryScores
  };

  return successResponse(res, stats, 'Dashboard stats fetched successfully.');
});
