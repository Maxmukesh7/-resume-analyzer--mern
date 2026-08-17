import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { parseAndSaveResume } from './resumeParserService.js';
import ApiError from '../utils/apiError.js';

// Action verbs list for achievements evaluation
const ACTION_VERBS = [
  'developed', 'built', 'created', 'implemented', 'engineered', 'managed', 'led',
  'optimized', 'designed', 'architected', 'reduced', 'increased', 'improved',
  'refactored', 'orchestrated', 'spearheaded', 'automated', 'delivered', 'launched'
];

// Essential ATS Industry Keywords dictionary
const BENCHMARK_KEYWORDS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Python',
  'Java', 'HTML', 'CSS', 'Tailwind', 'SQL', 'Git', 'AWS', 'Docker', 'REST API',
  'GraphQL', 'Next.js', 'Redux', 'CI/CD', 'Agile', 'Unit Testing'
];

/**
 * Evaluate parsed resume and compute deterministic 0-100 ATS scores
 * @param {string} resumeId - MongoDB Resume document ID
 * @param {string} userId - Authenticated user ID
 * @param {boolean} force - Force re-evaluation bypass cache
 * @returns {Promise<Object>} ResumeAnalysis document
 */
export const evaluateResumeAts = async (resumeId, userId, force = false) => {
  let resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  // Ownership assertion
  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to evaluate this resume.');
  }

  // Check cached analysis in MongoDB
  const existingAnalysis = await ResumeAnalysis.findOne({ resume: resumeId });
  if (!force && existingAnalysis && existingAnalysis.overallScore !== undefined) {
    console.log(`ℹ️ [DEBUG] Cached ATS analysis found for Resume ID ${resumeId}. Returning existing analysis.`);
    return existingAnalysis;
  }

  // Ensure resume is parsed
  if (resume.parseStatus !== 'parsed' || !resume.parsedData?.fullName) {
    console.log(`⚙️ [DEBUG] Resume ${resumeId} not yet parsed. Running parser before evaluation...`);
    resume = await parseAndSaveResume(resumeId, false);
  }

  const parsed = resume.parsedData || {};
  const rawText = resume.parsedText || '';
  const lowerText = rawText.toLowerCase();

  // --- CATEGORY 1: Contact Information (5%) ---
  let contactScore = 0;
  if (parsed.email) contactScore += 40;
  if (parsed.phone) contactScore += 30;
  if (parsed.fullName && parsed.fullName !== 'Candidate') contactScore += 20;
  if (parsed.location || parsed.linkedin || parsed.github) contactScore += 10;
  if (!parsed.email) contactScore = Math.max(0, contactScore - 50);
  if (!parsed.phone) contactScore = Math.max(0, contactScore - 30);
  contactScore = Math.min(100, Math.max(0, contactScore));

  // --- CATEGORY 2: Skills Score (20%) ---
  let skillsScore = 0;
  const rawSkills = parsed.skills || [];
  const uniqueSkills = Array.from(new Set(rawSkills.map((s) => s.toLowerCase())));
  const duplicateCount = rawSkills.length - uniqueSkills.length;

  if (uniqueSkills.length === 0) {
    skillsScore = 0;
  } else if (uniqueSkills.length <= 2) {
    skillsScore = 45;
  } else if (uniqueSkills.length <= 5) {
    skillsScore = 75;
  } else if (uniqueSkills.length <= 9) {
    skillsScore = 90;
  } else {
    skillsScore = 100;
  }
  if (duplicateCount > 0) skillsScore = Math.max(0, skillsScore - duplicateCount * 10);

  // --- CATEGORY 3: Experience Score (20%) ---
  let experienceScore = 0;
  const expItems = parsed.experience || [];
  if (expItems.length === 0) {
    experienceScore = 0;
  } else if (expItems.length === 1) {
    experienceScore = 65;
  } else if (expItems.length === 2) {
    experienceScore = 85;
  } else {
    experienceScore = 100;
  }
  // Action verb presence bonus
  const actionVerbCount = ACTION_VERBS.filter((verb) => lowerText.includes(verb)).length;
  if (actionVerbCount > 0 && expItems.length > 0) {
    experienceScore = Math.min(100, experienceScore + 10);
  }

  // --- CATEGORY 4: Education Score (15%) ---
  let educationScore = 0;
  const eduItems = parsed.education || [];
  if (eduItems.length === 0) {
    educationScore = 0;
  } else {
    const eduText = eduItems.join(' ').toLowerCase();
    if (eduText.includes('master') || eduText.includes('m.tech') || eduText.includes('phd') || eduText.includes('m.s.')) {
      educationScore = 100;
    } else if (eduText.includes('bachelor') || eduText.includes('b.tech') || eduText.includes('degree') || eduText.includes('b.e.') || eduText.includes('b.s.')) {
      educationScore = 90;
    } else {
      educationScore = 75;
    }
  }

  // --- CATEGORY 5: Projects Score (10%) ---
  let projectsScore = 0;
  const projItems = parsed.projects || [];
  if (projItems.length === 0) {
    projectsScore = 0;
  } else if (projItems.length === 1) {
    projectsScore = 60;
  } else if (projItems.length === 2) {
    projectsScore = 85;
  } else {
    projectsScore = 100;
  }

  // --- CATEGORY 6: Certifications Score (5%) ---
  let certificationsScore = 0;
  const certItems = parsed.certifications || [];
  if (certItems.length === 0) {
    certificationsScore = 40; // Neutral baseline
  } else if (certItems.length === 1) {
    certificationsScore = 80;
  } else {
    certificationsScore = 100;
  }

  // --- CATEGORY 7: Achievements Score (5%) ---
  let achievementsScore = 50;
  const hasNumbers = /\d+%|\$\d+|\d+\s*years|\bfirst place\b|\bawarded\b/i.test(rawText);
  if (hasNumbers) achievementsScore += 30;
  if (actionVerbCount >= 3) achievementsScore += 20;
  achievementsScore = Math.min(100, achievementsScore);

  // --- CATEGORY 8: Keyword Quality Score (10%) ---
  const detectedKeywords = uniqueSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  const missingKeywords = BENCHMARK_KEYWORDS.filter(
    (kw) => !lowerText.includes(kw.toLowerCase())
  );
  let keywordScore = 0;
  if (detectedKeywords.length >= 8) keywordScore = 100;
  else if (detectedKeywords.length >= 5) keywordScore = 80;
  else if (detectedKeywords.length >= 2) keywordScore = 60;
  else keywordScore = 30;

  const keywordCount = detectedKeywords.length;
  const keywordDensity = rawText.length > 0 ? Number(((keywordCount * 100) / (rawText.split(/\s+/).length || 1)).toFixed(2)) : 0;

  // --- CATEGORY 9: Resume Structure Score (10%) ---
  let structureScore = 100;
  const textLength = rawText.length;
  if (textLength < 200) structureScore -= 60;
  else if (textLength < 500) structureScore -= 20;

  const missingSections = [];
  if (expItems.length === 0) { missingSections.push('Work Experience'); structureScore -= 15; }
  if (eduItems.length === 0) { missingSections.push('Education'); structureScore -= 15; }
  if (projItems.length === 0) { missingSections.push('Projects'); structureScore -= 10; }
  if (uniqueSkills.length === 0) { missingSections.push('Skills'); structureScore -= 15; }
  structureScore = Math.max(0, structureScore);

  // --- CATEGORY 10: Formatting Score (10%) ---
  let formattingScore = 90;
  if (/\uFFFD/.test(rawText) || rawText.includes('??')) formattingScore -= 20;
  if (textLength > 5000) formattingScore -= 15;

  // --- OVERALL ATS SCORE COMPUTATION ---
  const rawOverall = Math.round(
    Math.min(100, Math.max(0, skillsScore)) * 0.20 +
    Math.min(100, Math.max(0, experienceScore)) * 0.20 +
    Math.min(100, Math.max(0, educationScore)) * 0.15 +
    Math.min(100, Math.max(0, projectsScore)) * 0.10 +
    Math.min(100, Math.max(0, structureScore)) * 0.10 +
    Math.min(100, Math.max(0, keywordScore)) * 0.10 +
    Math.min(100, Math.max(0, achievementsScore)) * 0.05 +
    Math.min(100, Math.max(0, certificationsScore)) * 0.05 +
    Math.min(100, Math.max(0, contactScore)) * 0.05 +
    Math.min(100, Math.max(0, formattingScore)) * 0.10
  );
  const overallScore = Math.min(100, Math.max(0, rawOverall));


  // Rating Label
  let ratingLabel = 'Needs Improvement';
  if (overallScore >= 90) ratingLabel = 'Excellent';
  else if (overallScore >= 80) ratingLabel = 'Very Good';
  else if (overallScore >= 70) ratingLabel = 'Good';

  // --- RULE-BASED FEEDBACK GENERATION ---
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (contactScore >= 80) strengths.push('Complete contact information provided (Email, Phone, Name).');
  else weaknesses.push('Incomplete contact details (missing email or phone number).');

  if (skillsScore >= 80) strengths.push(`Strong technical skills profile (${uniqueSkills.length} relevant skills detected).`);
  else {
    weaknesses.push('Low technical skill count detected.');
    recommendations.push('Add more relevant industry technical skills & frameworks.');
  }

  if (expItems.length >= 2) strengths.push('Solid work experience section with multiple entries.');
  else if (expItems.length === 0) {
    weaknesses.push('No work experience section identified.');
    recommendations.push('Add practical internships, freelance work, or position history.');
  }

  if (projItems.length >= 2) strengths.push('Demonstrated project portfolio with key implementations.');
  else recommendations.push('Include at least 2-3 detailed project descriptions with live URLs.');

  if (certItems.length > 0) strengths.push('Certifications listed to validate specialized knowledge.');
  else recommendations.push('Add industry certifications to strengthen your resume authority.');

  if (actionVerbCount < 3) {
    recommendations.push('Use strong action verbs (e.g. "developed", "architected", "optimized") in bullet points.');
  }

  if (!hasNumbers) {
    recommendations.push('Include quantitative metrics & achievements (e.g., "Increased performance by 30%").');
  }

  // Create or Update Analysis document in MongoDB
  const analysisData = {
    user: userId,
    resume: resumeId,
    overallScore,
    skillsScore,
    experienceScore,
    educationScore,
    projectsScore,
    structureScore,
    keywordScore,
    achievementsScore,
    certificationsScore,
    contactScore,
    formattingScore,
    ratingLabel,
    strengths,
    weaknesses,
    recommendations,
    missingSections,
    missingKeywords: missingKeywords.slice(0, 8),
    keywordAnalysis: {
      detectedKeywords,
      missingKeywords: missingKeywords.slice(0, 8),
      keywordCount,
      keywordDensity
    },
    generatedAt: new Date()
  };

  const analysis = await ResumeAnalysis.findOneAndUpdate(
    { resume: resumeId },
    analysisData,
    { new: true, upsert: true, runValidators: true }
  );

  console.log(`✅ [DEBUG] ATS evaluation completed for Resume ID ${resumeId}. Overall Score: ${overallScore}/100 (${ratingLabel}).`);
  return analysis;
};
