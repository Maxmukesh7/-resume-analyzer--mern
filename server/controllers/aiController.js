import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { generateGeminiResumeAnalysis } from '../services/geminiService.js';
import AIAnalysis from '../models/AIAnalysis.js';

/**
 * @desc    Analyze resume using Google Gemini AI
 * @route   POST /api/ai/analyze/:resumeId
 * @access  Private
 */
export const analyzeResumeWithAI = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const force = req.body?.force === true;

  const analysis = await generateGeminiResumeAnalysis(resumeId, req.user._id, force);

  return successResponse(
    res,
    analysis,
    'Google Gemini AI resume analysis generated successfully.'
  );
});

/**
 * @desc    Get stored AI analysis report for a specific resume
 * @route   GET /api/ai/report/:resumeId
 * @access  Private
 */
export const getAIAnalysisReport = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;

  const analysis = await generateGeminiResumeAnalysis(resumeId, req.user._id, false);

  return successResponse(
    res,
    analysis,
    'AI analysis report retrieved successfully.'
  );
});

/**
 * @desc    Get user's AI analysis history list
 * @route   GET /api/ai/history
 * @access  Private
 */
export const getAIAnalysisHistory = asyncHandler(async (req, res) => {
  const history = await AIAnalysis.find({ userId: req.user._id })
    .populate('resumeId', 'originalName fileName uploadDate')
    .sort({ createdAt: -1 });

  return successResponse(
    res,
    history,
    'AI analysis history retrieved successfully.'
  );
});
