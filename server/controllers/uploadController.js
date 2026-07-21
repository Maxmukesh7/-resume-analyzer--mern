import asyncHandler from '../middleware/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Upload a resume file (PDF/DOCX)
 * @route   POST /api/upload
 * @access  Private (Mocked)
 */
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select a resume file to upload.');
  }

  const fileData = {
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  };

  return successResponse(
    res,
    fileData,
    'Resume file uploaded successfully and saved in uploads folder.',
    201
  );
});
