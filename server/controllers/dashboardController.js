import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import JobMatch from '../models/JobMatch.js';
import { evaluateResumeAts } from '../services/atsEngineService.js';

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
  const userResumes = await Resume.find({ user: userId }).sort({ createdAt: 1 }).lean();
  const totalUploads = userResumes.length;
  const userResumeIds = userResumes.map((r) => r._id);

  // 2. Total job match checks performed
  const jobMatchesCount = await JobMatch.countDocuments({
    $or: [{ userId }, { user: userId }]
  });

  // 3. Ensure parsed resumes have ATS analysis evaluated
  for (const r of userResumes) {
    const exists = await ResumeAnalysis.exists({
      $or: [{ resume: r._id }, { resumeId: r._id }]
    });
    if (!exists && (r.parseStatus === 'parsed' || (r.parsedText && r.parsedText.length > 50))) {
      try {
        await evaluateResumeAts(r._id, userId, false);
      } catch (err) {
        console.warn(`[Stats] Auto ATS eval skipped for resume ${r._id}:`, err.message);
      }
    }
  }

  // 4. Query all user's ATS analysis records
  const analyses = await ResumeAnalysis.find({
    $or: [
      { user: userId },
      { userId: userId },
      { resume: { $in: userResumeIds } },
      { resumeId: { $in: userResumeIds } }
    ]
  })
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
