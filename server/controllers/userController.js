import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get current user profile details
 * @route   GET /api/users/profile
 * @access  Private (Mocked)
 */
export const getProfile = asyncHandler(async (req, res) => {
  const dummyProfile = {
    id: 'user-987',
    name: 'Mukesh Kumar',
    email: 'mukesh.kumar@example.com',
    phone: '+91 98765 43210',
    college: 'IIT Delhi',
    skills: ['React.js', 'Node.js', 'Express.js', 'Tailwind CSS'],
    experience: '2+ Years of Software Development Experience',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'
  };
  return successResponse(res, dummyProfile, 'User profile fetched successfully.');
});

/**
 * @desc    Update user profile credentials
 * @route   PUT /api/users/profile
 * @access  Private (Mocked)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updatedData = req.body;
  return successResponse(res, updatedData, 'Profile updated successfully.');
});

/**
 * @desc    Update system application settings
 * @route   PUT /api/users/settings
 * @access  Private (Mocked)
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const settingsData = req.body;
  return successResponse(res, settingsData, 'Application settings updated successfully.');
});
