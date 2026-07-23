import fs from 'fs';
import path from 'path';
import Resume from '../models/Resume.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';
import { parseAndSaveResume } from '../services/resumeParserService.js';
import { evaluateResumeAts } from '../services/atsEngineService.js';

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

  // Automatically trigger parsing after successful upload
  try {
    resume = await parseAndSaveResume(resume._id, true);
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

  const resumes = await Resume.find({ user: req.user._id }).sort({ uploadDate: -1 });

  return successResponse(
    res,
    resumes,
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

  // Delete physical file from disk if it exists
  if (resume.uploadPath && fs.existsSync(resume.uploadPath)) {
    try {
      await fs.promises.unlink(resume.uploadPath);
    } catch (err) {
      console.error(`Failed to delete physical file at ${resume.uploadPath}:`, err.message);
    }
  }

  // Delete MongoDB document
  await Resume.deleteOne({ _id: id });

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
