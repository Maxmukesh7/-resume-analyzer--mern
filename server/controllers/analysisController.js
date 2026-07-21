import asyncHandler from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Analyze a resume file against job targets (AI simulation)
 * @route   POST /api/analysis/scan
 * @access  Private (Mocked)
 */
export const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;

  // Placeholder AI Parsing diagnostic logic goes here in Phase 5
  const simulatedAtsAnalysis = {
    resumeId: resumeId || 'res-001',
    overallScore: 88,
    metrics: {
      keywordMatch: 85,
      skillsMatch: 90,
      formattingScore: 95,
      experienceScore: 80,
      educationScore: 90
    },
    strengths: [
      "Excellent density of tech stack keywords.",
      "Clear chronological layout formatting.",
      "No parsing errors; machine-readable layout."
    ],
    weaknesses: [
      "Multi-column grids might confuse legacy parsing systems.",
      "Slightly wordy bullet descriptions."
    ],
    missingKeywords: ['Docker', 'CI/CD Pipelines', 'Kubernetes'],
    recruiterSuggestions: [
      "Include direct URL links to live portfolio sites next to GitHub links.",
      "Condense project descriptions to a maximum of 3 lines."
    ],
    aiSuggestions: [
      "Add key technologies related to the targeted job description in skills tags."
    ]
  };

  return successResponse(res, simulatedAtsAnalysis, 'AI analysis diagnostics generated successfully.');
});

/**
 * @desc    Get detailed ATS analysis report for a specific resume ID
 * @route   GET /api/analysis/report/:id
 * @access  Private (Mocked)
 */
export const getAtsReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dummyReport = {
    id,
    resumeName: 'Mukesh_SDE_Resume_v1.pdf',
    overallScore: 92,
    uploadDate: '2026-07-20',
    metrics: {
      keywordMatch: 94,
      skillsMatch: 90,
      formattingScore: 95,
      experienceScore: 88,
      educationScore: 92
    },
    strengths: [
      "Excellent density of tech stack keywords (React, Node, Express, MongoDB).",
      "Perfect use of reverse chronological formatting.",
      "Quantified bullet achievements using the Google X-Y-Z formula."
    ],
    weaknesses: [
      "Slightly wordy summaries in the experience section.",
      "Missing links to live deployments."
    ],
    missingKeywords: ['GraphQL', 'Docker', 'CI/CD Pipelines', 'Kubernetes'],
    recruiterSuggestions: [
      "Refactor multi-column structure into a single-column layout.",
      "Include direct deployment links to live portfolios."
    ],
    aiSuggestions: [
      "Ensure all headings match standard ATS sections exactly."
    ]
  };

  return successResponse(res, dummyReport, `ATS report details for resume ${id} fetched successfully.`);
});
