import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import JobMatch from '../models/JobMatch.js';
import { compareResumeWithJobDescription } from '../services/jobMatch.service.js';

/**
 * @desc    Analyze resume against target Job Description
 * @route   POST /api/job-match/analyze
 * @access  Private
 */
export const analyzeJobMatch = asyncHandler(async (req, res) => {
  const { resumeId, jobTitle, companyName, jobDescription, force } = req.body;

  if (!resumeId) {
    throw new ApiError(400, 'Please select a valid resume file for comparison.');
  }

  if (!jobDescription || jobDescription.trim().length < 20) {
    throw new ApiError(400, 'Please paste a valid Job Description text (at least 20 characters).');
  }

  const result = await compareResumeWithJobDescription(
    req.user._id,
    resumeId,
    jobTitle,
    companyName,
    jobDescription,
    force === true
  );

  return successResponse(
    res,
    result,
    'Job description matching and skill gap analysis generated successfully.',
    201
  );
});

/**
 * @desc    Get user's job match history list with optional search query
 * @route   GET /api/job-match/history
 * @access  Private
 */
export const getJobMatchHistory = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { userId: req.user._id };

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { jobTitle: searchRegex },
      { companyName: searchRegex },
      { jobDescription: searchRegex }
    ];
  }

  const history = await JobMatch.find(filter)
    .populate('resumeId', 'originalName fileName uploadDate')
    .sort({ createdAt: -1 });

  return successResponse(
    res,
    history,
    'Job match analysis history retrieved successfully.'
  );
});

/**
 * @desc    Get specific job match analysis report by ID
 * @route   GET /api/job-match/:id
 * @access  Private
 */
export const getJobMatchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jobMatch = await JobMatch.findById(id).populate('resumeId', 'originalName fileName uploadDate');

  if (!jobMatch) {
    throw new ApiError(404, 'Job match report not found.');
  }

  if (jobMatch.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to view this report.');
  }

  return successResponse(
    res,
    jobMatch,
    'Job match analysis details retrieved successfully.'
  );
});

/**
 * @desc    Delete a job match analysis record
 * @route   DELETE /api/job-match/:id
 * @access  Private
 */
export const deleteJobMatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jobMatch = await JobMatch.findById(id);

  if (!jobMatch) {
    throw new ApiError(404, 'Job match report not found.');
  }

  if (jobMatch.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to delete this report.');
  }

  await JobMatch.deleteOne({ _id: id });

  return successResponse(
    res,
    { id },
    'Job match analysis report deleted successfully.'
  );
});
