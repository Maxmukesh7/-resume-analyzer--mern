import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import {
  rankMultipleResumesService,
  getRecruiterRankingsService,
  getRankingByIdService,
  deleteRankingService
} from '../services/candidateRankingService.js';
import logActivity from '../utils/activityLogger.js';

/**
 * @desc    Upload multiple resumes, evaluate ATS & Job Match, and automatically rank candidates
 * @route   POST /api/recruiter/rank-resumes
 * @access  Private (Recruiter / Admin)
 */
export const rankResumes = asyncHandler(async (req, res) => {
  const { jobTitle, companyName, jobDescription, weights } = req.body;
  const files = req.files || [];

  if (!files || files.length === 0) {
    throw new ApiError(400, 'Please select at least one resume file (PDF, DOC, DOCX) to upload and rank.');
  }

  let customWeights = {};
  if (weights) {
    try {
      customWeights = typeof weights === 'string' ? JSON.parse(weights) : weights;
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  const rankingSession = await rankMultipleResumesService({
    userId: req.user._id,
    jobTitle,
    companyName,
    jobDescription,
    files,
    customWeights
  });

  await logActivity({
    userId: req.user._id,
    action: 'Candidate Batch Ranked',
    description: `Ranked ${rankingSession.totalResumes} candidates for '${rankingSession.jobTitle}'. Top candidate: ${rankingSession.candidates[0]?.candidateName || 'N/A'}.`,
    req
  });

  return successResponse(
    res,
    rankingSession,
    `Successfully processed ${rankingSession.processedCount} of ${rankingSession.totalResumes} resumes and ranked candidates.`,
    201
  );
});

/**
 * @desc    Get list of candidate ranking sessions
 * @route   GET /api/recruiter/rankings
 * @access  Private (Recruiter / Admin)
 */
export const getRankings = asyncHandler(async (req, res) => {
  const result = await getRecruiterRankingsService(
    req.user._id,
    req.user.role,
    req.query
  );

  return successResponse(
    res,
    result,
    'Recruitment candidate rankings retrieved successfully.'
  );
});

/**
 * @desc    Get detailed candidate ranking session by ID
 * @route   GET /api/recruiter/rankings/:id
 * @access  Private (Recruiter / Admin)
 */
export const getRankingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ranking = await getRankingByIdService(
    id,
    req.user._id,
    req.user.role
  );

  return successResponse(
    res,
    ranking,
    'Candidate ranking details retrieved successfully.'
  );
});

/**
 * @desc    Delete a candidate ranking session
 * @route   DELETE /api/recruiter/rankings/:id
 * @access  Private (Recruiter / Admin)
 */
export const deleteRanking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await deleteRankingService(
    id,
    req.user._id,
    req.user.role
  );

  await logActivity({
    userId: req.user._id,
    action: 'Candidate Ranking Session Deleted',
    description: `Deleted candidate ranking session ID ${id}.`,
    req
  });

  return successResponse(
    res,
    result,
    'Candidate ranking session deleted successfully.'
  );
});
