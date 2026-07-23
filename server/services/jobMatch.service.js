import Resume from '../models/Resume.js';
import JobMatch from '../models/JobMatch.js';
import { parseAndSaveResume } from './resumeParserService.js';
import ApiError from '../utils/apiError.js';

// Technical & Soft Skills Keywords Master List
const SKILLS_MASTER_LIST = [
  'JavaScript', 'TypeScript', 'React', 'React.js', 'ReactJS', 'Node.js', 'NodeJS', 'Express', 'Express.js',
  'MongoDB', 'Python', 'Java', 'HTML', 'CSS', 'Tailwind', 'TailwindCSS', 'Bootstrap', 'Sass', 'LESS',
  'SQL', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API', 'Git', 'GitHub', 'AWS', 'Docker',
  'Kubernetes', 'CI/CD', 'Jenkins', 'Linux', 'Unit Testing', 'Jest', 'Mocha', 'Cypress',
  'Agile', 'Scrum', 'Microservices', 'Redux', 'Zustand', 'Next.js', 'Vue', 'Angular',
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Critical Thinking', 'Adaptability'
];

/**
 * Extract technical & domain keywords from JD string
 */
function extractKeywordsFromJD(jdText) {
  const lowerJD = jdText.toLowerCase();
  const foundKeywords = new Set();

  SKILLS_MASTER_LIST.forEach((kw) => {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lowerJD)) {
      foundKeywords.add(kw);
    }
  });

  return Array.from(foundKeywords);
}

/**
 * Evaluate Job Description match against uploaded candidate resume
 */
export const compareResumeWithJobDescription = async (
  userId,
  resumeId,
  jobTitle = 'Target Role',
  companyName = 'Target Company',
  jobDescription,
  force = false
) => {
  if (!jobDescription || jobDescription.trim().length < 20) {
    throw new ApiError(400, 'Please provide a valid, non-empty Job Description text (at least 20 characters).');
  }

  let resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to use this resume.');
  }

  // Ensure resume is parsed
  if (resume.parseStatus !== 'parsed' || !resume.parsedData?.fullName) {
    resume = await parseAndSaveResume(resumeId, false);
  }

  // Check MongoDB cache for exact same resume & JD string match
  const existingMatch = await JobMatch.findOne({
    userId,
    resumeId,
    jobTitle,
    jobDescription: jobDescription.trim()
  });

  if (!force && existingMatch) {
    console.log(`ℹ️ [DEBUG] Cached Job Match analysis found for Resume ID ${resumeId}. Returning existing document.`);
    return existingMatch;
  }

  const parsed = resume.parsedData || {};
  const rawText = (resume.parsedText || '').toLowerCase();

  // 1. Extract keywords from Job Description
  const jdKeywords = extractKeywordsFromJD(jobDescription);

  // 2. Candidate Resume Skills & Keywords
  const resumeSkills = (parsed.skills || []).map((s) => s.toLowerCase());

  // 3. Compute Matched vs Missing
  const matchedSkills = [];
  const missingSkills = [];
  const matchedKeywords = [];
  const missingKeywords = [];

  jdKeywords.forEach((kw) => {
    const lowerKw = kw.toLowerCase();
    const isSkillMatch = resumeSkills.some((s) => s.includes(lowerKw) || lowerKw.includes(s));
    const isTextMatch = rawText.includes(lowerKw);

    if (isSkillMatch || isTextMatch) {
      matchedKeywords.push(kw);
      if (isSkillMatch) matchedSkills.push(kw);
    } else {
      missingKeywords.push(kw);
      missingSkills.push(kw);
    }
  });

  // 4. Calculate Sub-Metric Scores
  let keywordMatchScore = jdKeywords.length > 0
    ? Math.round((matchedKeywords.length * 100) / jdKeywords.length)
    : 80;

  // Experience Match Calculation
  const expCount = parsed.experience?.length || 0;
  let experienceMatch = 50;
  if (expCount >= 3) experienceMatch = 95;
  else if (expCount === 2) experienceMatch = 80;
  else if (expCount === 1) experienceMatch = 65;

  // Education Match Calculation
  const eduCount = parsed.education?.length || 0;
  let educationMatch = eduCount > 0 ? 90 : 50;

  // Projects Match Calculation
  const projCount = parsed.projects?.length || 0;
  let projectsMatch = projCount >= 2 ? 90 : projCount === 1 ? 70 : 40;

  // Certification Match Calculation
  const certCount = parsed.certifications?.length || 0;
  let certificationMatch = certCount > 0 ? 90 : 60;

  // 5. Calculate Overall Match Percentage (0 - 100)
  const matchScore = Math.round(
    keywordMatchScore * 0.40 +
    experienceMatch * 0.20 +
    projectsMatch * 0.15 +
    educationMatch * 0.15 +
    certificationMatch * 0.10
  );

  // 6. Generate Feedback, Strengths, & Recommendations
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (matchedKeywords.length > 0) {
    strengths.push(`Matched ${matchedKeywords.length} key required technical skills: ${matchedKeywords.slice(0, 5).join(', ')}.`);
  }

  if (expCount >= 2) {
    strengths.push('Relevant work experience section aligned with candidate credentials.');
  }

  if (missingSkills.length > 0) {
    weaknesses.push(`Missing ${missingSkills.length} target job requirements: ${missingSkills.slice(0, 4).join(', ')}.`);
    recommendations.push(`Inject missing technical skills into skills & project sections: ${missingSkills.slice(0, 5).join(', ')}.`);
  }

  if (projCount < 2) {
    recommendations.push('Add 2+ practical project descriptions demonstrating required technologies.');
  }

  if (!rawText.includes('%') && !rawText.includes('increased') && !rawText.includes('reduced')) {
    recommendations.push('Add quantitative impact metrics (e.g. "Improved query performance by 40%").');
  }

  let overallFeedback = 'Candidate shows a good foundation for this position. Address missing skill gaps to maximize candidate interview readiness.';
  if (matchScore >= 85) {
    overallFeedback = 'Excellent match! Candidate credentials closely align with the targeted job description requirements.';
  } else if (matchScore < 60) {
    overallFeedback = 'Significant skill gap identified. Review missing requirements and update experience/project sections accordingly.';
  }

  // Create or Update JobMatch record in MongoDB
  const jobMatchData = {
    userId,
    resumeId,
    jobTitle: jobTitle || 'Target Role',
    companyName: companyName || 'Target Company',
    jobDescription: jobDescription.trim(),
    matchScore,
    matchedSkills: Array.from(new Set(matchedSkills)),
    missingSkills: Array.from(new Set(missingSkills)),
    matchedKeywords: Array.from(new Set(matchedKeywords)),
    missingKeywords: Array.from(new Set(missingKeywords)),
    strengths,
    weaknesses,
    recommendations,
    experienceMatch,
    educationMatch,
    projectsMatch,
    certificationMatch,
    overallFeedback
  };

  const savedJobMatch = await JobMatch.findOneAndUpdate(
    { userId, resumeId, jobTitle, jobDescription: jobDescription.trim() },
    jobMatchData,
    { new: true, upsert: true, runValidators: true }
  );

  console.log(`✅ [DEBUG] Job Match analysis completed. Match Score: ${matchScore}% for '${jobTitle}'.`);
  return savedJobMatch;
};
