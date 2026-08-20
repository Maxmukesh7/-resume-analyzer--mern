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

  // 1. Fetch user's active resumes and job matches count in parallel
  const [userResumes, jobMatchesCount] = await Promise.all([
    Resume.find({ user: userId }).select('_id parseStatus createdAt').sort({ createdAt: 1 }).lean(),
    JobMatch.countDocuments({
      $or: [{ userId }, { user: userId }]
    })
  ]);

  const totalUploads = userResumes.length;
  const userResumeIds = userResumes.map((r) => r._id);

  // 2. Query only existing ATS analyses belonging to active user resumes
  const analyses = userResumeIds.length > 0
    ? await ResumeAnalysis.find({ resume: { $in: userResumeIds } }).sort({ createdAt: 1 }).lean()
    : [];

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
    const scores = analyses.map((a) => (typeof a.overallScore === 'number' ? a.overallScore : (a.atsScore || 0)));
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    averageAtsScore = Math.round(sum / scores.length);
    highestAtsScore = Math.max(...scores);

    // Build timeline score history
    scoreHistory = analyses.slice(-6).map((a) => {
      const date = a.createdAt || a.generatedAt ? new Date(a.createdAt || a.generatedAt) : new Date();
      const monthName = date.toLocaleString('default', { month: 'short' });
      return {
        name: monthName,
        score: typeof a.overallScore === 'number' ? a.overallScore : (a.atsScore || 0)
      };
    });

    // Extract category breakdown from most recent analysis
    const latestAnalysis = analyses[analyses.length - 1];
    categoryScores = [
      {
        name: 'Keywords',
        score: latestAnalysis.keywordScore ?? latestAnalysis.sectionScores?.keywordScore ?? 0
      },
      {
        name: 'Formatting',
        score: latestAnalysis.formattingScore ?? latestAnalysis.sectionScores?.formattingScore ?? 0
      },
      {
        name: 'Experience',
        score: latestAnalysis.experienceScore ?? latestAnalysis.sectionScores?.experienceScore ?? 0
      },
      {
        name: 'Skills',
        score: latestAnalysis.skillsScore ?? latestAnalysis.sectionScores?.skillsScore ?? 0
      },
      {
        name: 'Education',
        score: latestAnalysis.educationScore ?? latestAnalysis.sectionScores?.educationScore ?? 0
      }
    ];
  } else if (userResumes.length > 0) {
    highestAtsScore = userResumes.some((r) => r.parseStatus === 'parsed') ? 75 : 0;
    averageAtsScore = highestAtsScore;
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
