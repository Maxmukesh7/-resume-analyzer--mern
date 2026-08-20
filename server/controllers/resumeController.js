import fs from 'fs';
import path from 'path';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import AIAnalysis from '../models/AIAnalysis.js';
import JobMatch from '../models/JobMatch.js';
import ResumeImprovement from '../models/ResumeImprovement.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';
import { parseAndSaveResume } from '../services/resumeParserService.js';
import { evaluateResumeAts } from '../services/atsEngineService.js';
import { generateGeminiResumeAnalysis } from '../services/geminiService.js';

/**
 * @desc    Upload a resume file (PDF/DOC/DOCX) and automatically parse text & candidate details
 * @route   POST /api/resumes/upload
 * @access  Private
 */
export const uploadResume = asyncHandler(async (req, res) => {
  console.log('req.file:', req.file);
  console.log('req.file.originalname:', req.file?.originalname);

  if (!req.file) {
    throw new ApiError(400, 'Please select a valid resume file (PDF, DOC, or DOCX) to upload.');
  }

  let resume = await Resume.create({
    user: req.user._id,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    uploadPath: req.file.path,
    uploadDate: new Date(),
    status: 'uploaded',
    parseStatus: 'pending'
  });

  // Automatically trigger parsing and ATS evaluation after successful upload
  try {
    resume = await parseAndSaveResume(resume._id, true);
    try {
      await evaluateResumeAts(resume._id, req.user._id, true);
    } catch (atsErr) {
      console.warn('⚠️ Automated ATS evaluation warning on upload:', atsErr.message);
    }
  } catch (err) {
    console.warn('⚠️ Automated parsing warning on upload:', err.message);
  }

  return successResponse(
    res,
    resume,
    'Resume uploaded and parsed successfully.',
    201
  );
});

/**
 * @desc    Get all uploaded resumes for the logged-in user
 * @route   GET /api/resume
 * @access  Private
 */
export const getResumes = asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const resumes = await Resume.find({ user: req.user._id }).sort({ uploadDate: -1 }).lean();
  const resumeIds = resumes.map((r) => r._id);

  const analyses = resumeIds.length > 0
    ? await ResumeAnalysis.find({ resume: { $in: resumeIds } }).lean()
    : [];

  const analysisMap = new Map();
  analyses.forEach((a) => {
    if (a.resume) {
      analysisMap.set(a.resume.toString(), a);
    }
  });

  const resumesWithScore = resumes.map((r) => {
    const analysis = analysisMap.get(r._id.toString());
    const score = analysis?.overallScore ?? (r.parseStatus === 'parsed' ? 80 : 0);
    return {
      ...r,
      atsScore: score,
      analysisId: analysis?._id || null
    };
  });

  return successResponse(
    res,
    resumesWithScore,
    'Resumes retrieved successfully.'
  );
});

/**
 * @desc    Get detailed data for a specific resume owned by logged-in user
 * @route   GET /api/resume/:id
 * @access  Private
 */
export const getResumeDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resume = await Resume.findById(id);

  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  // Ownership check
  if (resume.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to view this resume.');
  }

  return successResponse(
    res,
    resume,
    'Resume details retrieved successfully.'
  );
});

/**
 * @desc    Delete a resume document from MongoDB and physical storage
 * @route   DELETE /api/resume/:id
 * @access  Private
 */
export const deleteResume = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resume = await Resume.findById(id);

  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  // Ownership check
  if (resume.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to delete this resume.');
  }

  // Delete physical file asynchronously from disk if it exists
  if (resume.uploadPath) {
    fs.promises.unlink(resume.uploadPath).catch((err) => {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete physical file at ${resume.uploadPath}:`, err.message);
      }
    });
  }

  // Concurrently delete MongoDB document and all related cascade records
  await Promise.all([
    Resume.deleteOne({ _id: id }),
    ResumeAnalysis.deleteMany({ $or: [{ resume: id }, { resumeId: id }] }),
    AIAnalysis.deleteMany({ resumeId: id }),
    JobMatch.deleteMany({ resumeId: id }),
    ResumeImprovement.deleteMany({ resumeId: id })
  ]);

  return successResponse(
    res,
    { id },
    'Resume deleted successfully from storage and database.'
  );
});

/**
 * @desc    Trigger/Re-run resume text & detail parsing
 * @route   POST /api/resumes/:id/parse
 * @access  Private
 */
export const parseResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const resume = await Resume.findById(id);

  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to parse this resume.');
  }

  const updatedResume = await parseAndSaveResume(id, req.body?.force === true);

  return successResponse(
    res,
    updatedResume,
    'Resume parsed successfully.'
  );
});

/**
 * @desc    Get parsed candidate details for a specific resume
 * @route   GET /api/resumes/:id/parsed
 * @access  Private
 */
export const getParsedResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const resume = await Resume.findById(id);

  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied.');
  }

  // If not parsed yet, trigger parsing
  if (resume.parseStatus !== 'parsed' || !resume.parsedData?.fullName) {
    const updated = await parseAndSaveResume(id, false);
    return successResponse(res, updated.parsedData, 'Parsed resume data retrieved successfully.');
  }

  return successResponse(
    res,
    resume.parsedData,
    'Parsed resume data retrieved successfully.'
  );
});

/**
 * @desc    Get extracted raw text for a specific resume
 * @route   GET /api/resumes/:id/text
 * @access  Private
 */
export const getResumeText = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const resume = await Resume.findById(id);

  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied.');
  }

  if (!resume.parsedText && resume.parseStatus !== 'failed') {
    const updated = await parseAndSaveResume(id, false);
    return successResponse(
      res,
      { rawText: updated.parsedText, textLength: updated.parsedText?.length || 0 },
      'Extracted raw text retrieved successfully.'
    );
  }

  return successResponse(
    res,
    { rawText: resume.parsedText, textLength: resume.parsedText?.length || 0 },
    'Extracted raw text retrieved successfully.'
  );
});

/**
 * @desc    Analyze a resume using ATS Evaluation Engine (0-100 score)
 * @route   POST /api/resumes/:id/analyze
 * @access  Private
 */
export const analyzeResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const force = req.body?.force === true;

  const analysis = await evaluateResumeAts(id, req.user._id, force);

  return successResponse(
    res,
    analysis,
    'ATS resume evaluation generated successfully.'
  );
});

/**
 * @desc    Get cached ATS analysis report for a resume
 * @route   GET /api/resumes/:id/analysis
 * @access  Private
 */
export const getResumeAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const analysis = await evaluateResumeAts(id, req.user._id, false);

  return successResponse(
    res,
    analysis,
    'ATS evaluation report retrieved successfully.'
  );
});

/**
 * @desc    Get complete analysis (Resume details, ATS Analysis, AI Analysis) for a resume
 * @route   GET /api/resumes/:id/complete-analysis
 * @access  Private
 */
export const getCompleteResumeAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resume = await Resume.findById(id);
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to view this analysis.');
  }

  // Fetch ATS & AI analysis documents in parallel
  const [atsAnalysis, aiAnalysis] = await Promise.all([
    ResumeAnalysis.findOne({ resume: id }),
    AIAnalysis.findOne({ resumeId: id })
  ]);

  const isParsed = resume.parseStatus === 'parsed' && Boolean(resume.parsedData?.fullName);
  const hasAts = Boolean(atsAnalysis && typeof atsAnalysis.overallScore === 'number');
  const hasAi = Boolean(aiAnalysis && aiAnalysis.summary);

  let state = 'COMPLETED';
  if (!isParsed) {
    state = resume.parseStatus === 'failed' ? 'FAILED' : 'PARSING';
  } else if (!hasAts) {
    state = 'ATS_ANALYSIS';
  } else if (!hasAi) {
    state = 'AI_ANALYSIS';
  }

  return successResponse(
    res,
    {
      resume,
      atsAnalysis: atsAnalysis || null,
      aiAnalysis: aiAnalysis || null,
      status: {
        state,
        isParsed,
        hasAts,
        hasAi,
        parseStatus: resume.parseStatus || 'pending',
        parseError: resume.parseError || ''
      }
    },
    'Complete resume analysis retrieved successfully.'
  );
});

/**
 * @desc    Trigger automated end-to-end resume analysis pipeline (Parsing -> ATS -> AI)
 * @route   POST /api/resumes/:id/auto-analyze
 * @access  Private
 */
export const autoAnalyzeResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { force } = req.body || {};

  let resume = await Resume.findById(id);
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied.');
  }

  const stageStatuses = {
    upload: 'completed',
    parsing: 'pending',
    ats: 'pending',
    ai: 'pending',
    errors: {}
  };

  // Step 1: Parsing
  try {
    if (resume.parseStatus !== 'parsed' || !resume.parsedData?.fullName || force) {
      resume = await parseAndSaveResume(id, force === true);
    }
    stageStatuses.parsing = 'completed';
  } catch (parseErr) {
    stageStatuses.parsing = 'failed';
    stageStatuses.errors.parsing = parseErr.message;
    return successResponse(
      res,
      {
        resume,
        atsAnalysis: null,
        aiAnalysis: null,
        stageStatuses,
        state: 'FAILED',
        message: `Parsing failed: ${parseErr.message}`
      },
      'Parsing failed.',
      200
    );
  }

  // Step 2: ATS Evaluation
  let atsAnalysis = null;
  try {
    atsAnalysis = await evaluateResumeAts(id, req.user._id, force === true);
    stageStatuses.ats = 'completed';
  } catch (atsErr) {
    stageStatuses.ats = 'failed';
    stageStatuses.errors.ats = atsErr.message;
    return successResponse(
      res,
      {
        resume,
        atsAnalysis: null,
        aiAnalysis: null,
        stageStatuses,
        state: 'FAILED',
        message: `ATS Evaluation failed: ${atsErr.message}`
      },
      'ATS Evaluation failed.',
      200
    );
  }

  // Step 3: AI Analysis (Gemini)
  let aiAnalysis = null;
  try {
    aiAnalysis = await generateGeminiResumeAnalysis(id, req.user._id, force === true);
    stageStatuses.ai = 'completed';
  } catch (aiErr) {
    console.warn(`⚠️ [AutoAnalyze] AI analysis encountered error for resume ${id}:`, aiErr.message);
    stageStatuses.ai = 'failed';
    stageStatuses.errors.ai = aiErr.message || 'AI analysis could not be completed.';
  }

  const overallState = stageStatuses.ai === 'completed' ? 'COMPLETED' : 'ATS_COMPLETED_AI_FAILED';

  return successResponse(
    res,
    {
      resume,
      atsAnalysis,
      aiAnalysis,
      stageStatuses,
      state: overallState
    },
    overallState === 'COMPLETED'
      ? 'Resume analysis completed successfully.'
      : 'ATS analysis completed. AI analysis could not be completed.'
  );
});

