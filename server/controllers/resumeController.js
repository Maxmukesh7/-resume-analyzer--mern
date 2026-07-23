import fs from 'fs';
import path from 'path';
import Resume from '../models/Resume.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Upload a resume file (PDF/DOCX)
 * @route   POST /api/resume/upload
 * @access  Private
 */
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select a valid resume file (PDF or DOCX) to upload.');
  }

  const resume = await Resume.create({
    user: req.user._id,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    uploadPath: req.file.path,
    uploadDate: new Date(),
    status: 'Uploaded'
  });

  return successResponse(
    res,
    resume,
    'Resume uploaded and saved successfully.',
    201
  );
});

/**
 * @desc    Get all uploaded resumes for the logged-in user
 * @route   GET /api/resume
 * @access  Private
 */
export const getResumes = asyncHandler(async (req, res) => {
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
