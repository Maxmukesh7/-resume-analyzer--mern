import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationParams, getPaginationMetadata } from '../utils/paginationHelper.js';

/**
 * @desc    Get paginated resume upload history logs
 * @route   GET /api/resume/history
 * @access  Private (Mocked)
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query, 5);

  const dummyResumesList = [
    { id: 'res-001', name: 'Mukesh_SDE_Resume_v1.pdf', uploadDate: '2026-07-20', score: 92, status: 'Optimized', fileSize: '1.2 MB' },
    { id: 'res-002', name: 'Mukesh_Frontend_Resume.pdf', uploadDate: '2026-07-18', score: 84, status: 'Good', fileSize: '980 KB' },
    { id: 'res-003', name: 'Mukesh_Resume_Draft.docx', uploadDate: '2026-07-10', score: 58, status: 'Needs Action', fileSize: '450 KB' },
    { id: 'res-004', name: 'General_Resume_Backup.pdf', uploadDate: '2026-06-15', score: 68, status: 'Needs Action', fileSize: '1.1 MB' }
  ];

  const totalItems = dummyResumesList.length;
  const paginatedData = dummyResumesList.slice((page - 1) * limit, page * limit);
  const metadata = getPaginationMetadata(totalItems, page, limit);

  return successResponse(res, { resumes: paginatedData, pagination: metadata }, 'Resume history fetched successfully.');
});

/**
 * @desc    Get detailed diagnostic data for a specific resume
 * @route   GET /api/resume/:id
 * @access  Private (Mocked)
 */
export const getResumeDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dummyResume = {
    id,
    name: 'Mukesh_SDE_Resume_v1.pdf',
    uploadDate: '2026-07-20',
    score: 92,
    status: 'Optimized',
    fileSize: '1.2 MB',
    keywords: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS']
  };
  return successResponse(res, dummyResume, 'Resume details retrieved successfully.');
});

/**
 * @desc    Delete a resume scan entry from database history
 * @route   DELETE /api/resume/:id
 * @access  Private (Mocked)
 */
export const deleteResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  return successResponse(res, { id }, `Resume entry ${id} successfully deleted.`);
});
