import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { generateGeminiResumeAnalysis } from '../services/geminiService.js';
import {
  improveFullResumeService,
  rewriteSummaryService,
  rewriteProjectService,
  rewriteExperienceService,
  getStoredImprovementsService
} from '../services/resumeImprovementService.js';
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

/**
 * @desc    Generate full AI resume improvement and store in MongoDB
 * @route   POST /api/ai/improve/:resumeId
 * @access  Private
 */
export const improveFullResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const { targetJobDescription, experienceLevel, industry, force } = req.body || {};

  const improvement = await improveFullResumeService(resumeId, req.user._id, {
    targetJobDescription,
    experienceLevel,
    industry,
    force: force === true
  });

  return successResponse(
    res,
    improvement,
    'AI resume improvements generated successfully.'
  );
});

/**
 * @desc    AI Professional Summary Generator (Fresher & Experienced)
 * @route   POST /api/ai/rewrite-summary
 * @access  Private
 */
export const rewriteSummary = asyncHandler(async (req, res) => {
  const { currentSummary, experienceLevel, targetRole, skills } = req.body || {};

  const result = await rewriteSummaryService({
    currentSummary,
    experienceLevel,
    targetRole,
    skills
  });

  return successResponse(
    res,
    result,
    'Professional summary rewritten successfully.'
  );
});

/**
 * @desc    AI Project Rewriter & Bullet Point Enhancer
 * @route   POST /api/ai/rewrite-project
 * @access  Private
 */
export const rewriteProject = asyncHandler(async (req, res) => {
  const { title, description, technologies, bulletPoints } = req.body || {};

  const result = await rewriteProjectService({
    title,
    description,
    technologies,
    bulletPoints
  });

  return successResponse(
    res,
    result,
    'Project details enhanced successfully.'
  );
});

/**
 * @desc    AI Experience Rewriter & Bullet Point Enhancer
 * @route   POST /api/ai/rewrite-experience
 * @access  Private
 */
export const rewriteExperience = asyncHandler(async (req, res) => {
  const { company, role, description, bulletPoints } = req.body || {};

  const result = await rewriteExperienceService({
    company,
    role,
    description,
    bulletPoints
  });

  return successResponse(
    res,
    result,
    'Work experience enhanced successfully.'
  );
});

/**
 * @desc    Get stored AI improvements for a resume
 * @route   GET /api/ai/improvements/:resumeId
 * @access  Private
 */
export const getResumeImprovements = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;

  const improvement = await getStoredImprovementsService(resumeId, req.user._id);

  return successResponse(
    res,
    improvement || null,
    'Stored resume improvements retrieved successfully.'
  );
});
