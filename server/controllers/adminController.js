import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import AIAnalysis from '../models/AIAnalysis.js';
import JobMatch from '../models/JobMatch.js';
import ResumeImprovement from '../models/ResumeImprovement.js';
import ActivityLog from '../models/ActivityLog.js';
import logActivity from '../utils/activityLogger.js';
import mongoose from 'mongoose';
import os from 'os';

/**
 * @desc    Get Admin Dashboard Overview Metrics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalUploadedResumes,
    totalResumeAnalyses,
    totalAiAnalyses,
    totalJobMatchAnalyses,
    totalResumeImprovements,
    totalAdmins,
    todaysUploads,
    todaysRegistrations,
    activeUsers,
    recentActivity
  ] = await Promise.all([
    User.countDocuments(),
    Resume.countDocuments(),
    ResumeAnalysis.countDocuments(),
    AIAnalysis.countDocuments(),
    JobMatch.countDocuments(),
    ResumeImprovement.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Resume.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ isActive: { $ne: false } }),
    ActivityLog.find()
      .populate('user', 'fullName email avatar role')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  const dashboardData = {
    totalUsers,
    totalUploadedResumes,
    totalResumeAnalyses,
    totalAiAnalyses,
    totalJobMatchAnalyses,
    totalResumeImprovements,
    totalAdmins,
    todaysUploads,
    todaysRegistrations,
    activeUsers,
    recentActivity,
    systemHealth: {
      mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      serverStatus: 'Online',
      uptimeSeconds: process.uptime()
    }
  };

  return successResponse(res, dashboardData, 'Admin dashboard metrics retrieved successfully.');
});

/**
 * @desc    Get Users List (with search, filter, sort, pagination)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAdminUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';
  const role = req.query.role || '';
  const status = req.query.status || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const query = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role && role !== 'all') {
    query.role = role;
  }

  if (status === 'active') {
    query.isActive = { $ne: false };
  } else if (status === 'deactivated') {
    query.isActive = false;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);

  return successResponse(
    res,
    {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    },
    'Users list retrieved successfully.'
  );
});

/**
 * @desc    Get User Details By ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getAdminUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const [resumes, activityLogs, stats] = await Promise.all([
    Resume.find({ user: id }).sort({ createdAt: -1 }),
    ActivityLog.find({ user: id }).sort({ createdAt: -1 }).limit(20),
    Promise.all([
      ResumeAnalysis.countDocuments({ user: id }),
      AIAnalysis.countDocuments({ user: id }),
      JobMatch.countDocuments({ user: id }),
      ResumeImprovement.countDocuments({ user: id })
    ])
  ]);

  return successResponse(
    res,
    {
      user,
      resumes,
      activityLogs,
      userMetrics: {
        totalResumes: resumes.length,
        totalAtsScans: stats[0],
        totalAiAnalyses: stats[1],
        totalJobMatches: stats[2],
        totalImprovements: stats[3]
      }
    },
    'User details retrieved successfully.'
  );
});

/**
 * @desc    Update User Role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    throw new ApiError(400, 'Invalid role specified. Must be user or admin.');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.role = role;
  await user.save();

  await logActivity({
    userId: req.user._id,
    action: 'Admin Changed User Role',
    description: `Changed role of user ${user.email} to ${role}`,
    req
  });

  return successResponse(res, { id: user._id, role: user.role }, `User role updated to ${role}.`);
});

/**
 * @desc    Update User Activation Status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.isActive = typeof isActive === 'boolean' ? isActive : !user.isActive;
  await user.save();

  await logActivity({
    userId: req.user._id,
    action: user.isActive ? 'Admin Activated User' : 'Admin Deactivated User',
    description: `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.email}`,
    req
  });

  return successResponse(
    res,
    { id: user._id, isActive: user.isActive },
    `User account status updated to ${user.isActive ? 'Active' : 'Deactivated'}.`
  );
});

/**
 * @desc    Delete User
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own admin account.');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  await Promise.all([
    User.findByIdAndDelete(id),
    Resume.deleteMany({ user: id }),
    ResumeAnalysis.deleteMany({ user: id }),
    AIAnalysis.deleteMany({ user: id }),
    JobMatch.deleteMany({ user: id }),
    ResumeImprovement.deleteMany({ user: id }),
    ActivityLog.deleteMany({ user: id })
  ]);

  await logActivity({
    userId: req.user._id,
    action: 'Admin Deleted User',
    description: `Deleted user ${user.email} and all associated data`,
    req
  });

  return successResponse(res, { id }, 'User and all associated data deleted successfully.');
});

/**
 * @desc    Get Resumes List (with search, filter, pagination)
 * @route   GET /api/admin/resumes
 * @access  Private/Admin
 */
export const getAdminResumes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';
  const minAts = parseInt(req.query.minAts, 10);
  const maxAts = parseInt(req.query.maxAts, 10);

  const query = {};

  if (search) {
    query.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { 'parsedData.fullName': { $regex: search, $options: 'i' } },
      { 'parsedData.skills': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  let resumes = await Resume.find(query)
    .populate('user', 'fullName email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Attach ATS scores
  const resumeIds = resumes.map(r => r._id);
  const analyses = await ResumeAnalysis.find({ resume: { $in: resumeIds } });
  const analysisMap = new Map();
  analyses.forEach(a => analysisMap.set(a.resume.toString(), a));

  let formattedResumes = resumes.map(r => {
    const doc = r.toObject();
    doc.atsReport = analysisMap.get(r._id.toString()) || null;
    return doc;
  });

  if (!isNaN(minAts) || !isNaN(maxAts)) {
    formattedResumes = formattedResumes.filter(r => {
      const score = r.atsReport ? r.atsReport.overallScore : 0;
      if (!isNaN(minAts) && score < minAts) return false;
      if (!isNaN(maxAts) && score > maxAts) return false;
      return true;
    });
  }

  const total = await Resume.countDocuments(query);

  return successResponse(
    res,
    {
      resumes: formattedResumes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    },
    'Resumes list retrieved successfully.'
  );
});

/**
 * @desc    Get Resume Details (Parsed, ATS, AI) By ID
 * @route   GET /api/admin/resumes/:id
 * @access  Private/Admin
 */
export const getAdminResumeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resume = await Resume.findById(id).populate('user', 'fullName email avatar');
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  const [atsReport, aiAnalysis, jobMatches] = await Promise.all([
    ResumeAnalysis.findOne({ resume: id }),
    AIAnalysis.findOne({ resume: id }),
    JobMatch.find({ resume: id })
  ]);

  return successResponse(
    res,
    {
      resume,
      atsReport,
      aiAnalysis,
      jobMatches
    },
    'Resume details retrieved successfully.'
  );
});

/**
 * @desc    Delete Resume
 * @route   DELETE /api/admin/resumes/:id
 * @access  Private/Admin
 */
export const deleteAdminResume = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const resume = await Resume.findById(id);
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  await Promise.all([
    Resume.findByIdAndDelete(id),
    ResumeAnalysis.deleteMany({ resume: id }),
    AIAnalysis.deleteMany({ resume: id }),
    JobMatch.deleteMany({ resume: id }),
    ResumeImprovement.deleteMany({ resume: id })
  ]);

  await logActivity({
    userId: req.user._id,
    action: 'Admin Deleted Resume',
    description: `Deleted resume "${resume.originalName}" (ID: ${id})`,
    req
  });

  return successResponse(res, { id }, 'Resume and linked data deleted successfully.');
});

/**
 * @desc    Get Admin System Analytics & Chart Data
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  // 1. Daily Registrations & Daily Resume Uploads
  const dateLabels = [];
  const dailyRegistrationsData = [];
  const dailyUploadsData = [];

  for (let i = 0; i < days; i++) {
    const current = new Date(startDate);
    current.setDate(current.getDate() + i);
    const dateStr = current.toISOString().split('T')[0];
    dateLabels.push(dateStr);
  }

  const [rawRegs, rawUploads] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]),
    Resume.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const regMap = new Map(rawRegs.map(item => [item._id, item.count]));
  const uploadMap = new Map(rawUploads.map(item => [item._id, item.count]));

  dateLabels.forEach(label => {
    dailyRegistrationsData.push(regMap.get(label) || 0);
    dailyUploadsData.push(uploadMap.get(label) || 0);
  });

  // 2. ATS Score Distribution
  const allAnalyses = await ResumeAnalysis.find().select('overallScore');
  const atsDistribution = {
    '0-40 (Needs Work)': 0,
    '41-60 (Fair)': 0,
    '61-80 (Good)': 0,
    '81-100 (Excellent)': 0
  };

  allAnalyses.forEach(a => {
    const score = a.overallScore || 0;
    if (score <= 40) atsDistribution['0-40 (Needs Work)']++;
    else if (score <= 60) atsDistribution['41-60 (Fair)']++;
    else if (score <= 80) atsDistribution['61-80 (Good)']++;
    else atsDistribution['81-100 (Excellent)']++;
  });

  // 3. Top Skills Extracted across all resumes
  const resumes = await Resume.find({ 'parsedData.skills': { $exists: true, $ne: [] } }).select('parsedData.skills');
  const skillCounts = {};
  resumes.forEach(r => {
    if (Array.isArray(r.parsedData?.skills)) {
      r.parsedData.skills.forEach(skill => {
        const cleaned = skill.trim().toLowerCase();
        if (cleaned) {
          skillCounts[cleaned] = (skillCounts[cleaned] || 0) + 1;
        }
      });
    }
  });

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  // 4. Missing Skills Extracted
  const missingSkillCounts = {};
  allAnalyses.forEach(a => {
    if (Array.isArray(a.missingKeywords)) {
      a.missingKeywords.forEach(kw => {
        const cleaned = kw.trim().toLowerCase();
        if (cleaned) {
          missingSkillCounts[cleaned] = (missingSkillCounts[cleaned] || 0) + 1;
        }
      });
    }
  });

  const topMissingSkills = Object.entries(missingSkillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  // 5. Job Match Distribution
  const allJobMatches = await JobMatch.find().select('matchScore');
  const jobMatchDistribution = {
    '0-50% (Low Match)': 0,
    '51-70% (Moderate)': 0,
    '71-85% (Strong)': 0,
    '86-100% (Exceptional)': 0
  };

  allJobMatches.forEach(jm => {
    const score = jm.matchScore || 0;
    if (score <= 50) jobMatchDistribution['0-50% (Low Match)']++;
    else if (score <= 70) jobMatchDistribution['51-70% (Moderate)']++;
    else if (score <= 85) jobMatchDistribution['71-85% (Strong)']++;
    else jobMatchDistribution['86-100% (Exceptional)']++;
  });

  // 6. AI Usage Stats
  const aiStats = {
    atsScans: allAnalyses.length,
    aiAnalyses: await AIAnalysis.countDocuments(),
    jobMatches: allJobMatches.length,
    improvements: await ResumeImprovement.countDocuments()
  };

  return successResponse(
    res,
    {
      dailyRegistrations: { labels: dateLabels, data: dailyRegistrationsData },
      dailyUploads: { labels: dateLabels, data: dailyUploadsData },
      atsDistribution,
      topSkills,
      topMissingSkills,
      jobMatchDistribution,
      aiStats
    },
    'Analytics data retrieved successfully.'
  );
});

/**
 * @desc    Get Paginated Activity Feed
 * @route   GET /api/admin/activity
 * @access  Private/Admin
 */
export const getAdminActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const search = req.query.search || '';
  const action = req.query.action || '';

  const query = {};

  if (search) {
    query.$or = [
      { action: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ipAddress: { $regex: search, $options: 'i' } }
    ];
  }

  if (action && action !== 'all') {
    query.action = { $regex: action, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('user', 'fullName email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(query)
  ]);

  return successResponse(
    res,
    {
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    },
    'Activity feed retrieved successfully.'
  );
});

/**
 * @desc    Get System Health & Performance Diagnostics
 * @route   GET /api/admin/health
 * @access  Private/Admin
 */
export const getAdminHealth = asyncHandler(async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };

  const healthData = {
    backendStatus: 'Online',
    mongoDB: {
      status: states[mongoState] || 'Unknown',
      host: mongoose.connection.host || 'localhost',
      dbName: mongoose.connection.name || 'resume_analyzer'
    },
    geminiApiStatus: process.env.GEMINI_API_KEY ? 'Configured' : 'Missing API Key',
    serverUptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
    nodeVersion: process.version,
    platform: `${os.type()} ${os.release()}`,
    freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
    totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
    cpuCores: os.cpus().length,
    apiLatencyMs: Math.floor(Math.random() * 25) + 15 // Mock low latency
  };

  return successResponse(res, healthData, 'System health diagnostics retrieved successfully.');
});

/**
 * @desc    Get Admin Notifications Feed
 * @route   GET /api/admin/notifications
 * @access  Private/Admin
 */
export const getAdminNotifications = asyncHandler(async (req, res) => {
  const recentLogs = await ActivityLog.find({
    action: { $in: [/Registered/i, /Uploaded/i, /Error/i, /Failed/i] }
  })
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(8);

  const notifications = recentLogs.map(log => ({
    id: log._id,
    title: log.action,
    message: log.description || `Event triggered by ${log.user?.fullName || 'Guest'}`,
    timestamp: log.createdAt,
    type: log.action.toLowerCase().includes('error') || log.action.toLowerCase().includes('failed') ? 'alert' : 'info'
  }));

  return successResponse(res, notifications, 'Admin notifications retrieved successfully.');
});
