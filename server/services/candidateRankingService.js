import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import Resume from '../models/Resume.js';
import CandidateRanking from '../models/CandidateRanking.js';
import { parseCandidateDetails } from './resumeParserService.js';
import ApiError from '../utils/apiError.js';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

// Action verbs list
const ACTION_VERBS = [
  'developed', 'built', 'created', 'implemented', 'engineered', 'managed', 'led',
  'optimized', 'designed', 'architected', 'reduced', 'increased', 'improved',
  'refactored', 'orchestrated', 'spearheaded', 'automated', 'delivered', 'launched'
];

// Canonical Skill Master Dictionary with Standard Display Names and Aliases
const CANONICAL_SKILLS_MAP = {
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'react': 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'react native': 'React Native',
  'node': 'Node.js',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'express': 'Express.js',
  'express.js': 'Express.js',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'python': 'Python',
  'java': 'Java',
  'core java': 'Java',
  'html': 'HTML',
  'html5': 'HTML',
  'css': 'CSS',
  'css3': 'CSS',
  'tailwind': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'sass': 'Sass',
  'scss': 'Sass',
  'sql': 'SQL',
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'redis': 'Redis',
  'graphql': 'GraphQL',
  'rest api': 'REST API',
  'rest': 'REST API',
  'restful': 'REST API',
  'restful api': 'REST API',
  'git': 'Git',
  'github': 'GitHub',
  'aws': 'AWS',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'jenkins': 'Jenkins',
  'linux': 'Linux',
  'bash': 'Bash',
  'unit testing': 'Unit Testing',
  'jest': 'Jest',
  'mocha': 'Mocha',
  'cypress': 'Cypress',
  'agile': 'Agile',
  'scrum': 'Scrum',
  'microservices': 'Microservices',
  'redux': 'Redux',
  'zustand': 'Zustand',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'vue': 'Vue.js',
  'vue.js': 'Vue.js',
  'vuejs': 'Vue.js',
  'angular': 'Angular',
  'c++': 'C++',
  'cpp': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'go': 'Go',
  'golang': 'Go',
  'c': 'C',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'spring': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'communication': 'Communication',
  'leadership': 'Leadership',
  'problem solving': 'Problem Solving',
  'teamwork': 'Teamwork',
  'critical thinking': 'Critical Thinking',
  'adaptability': 'Adaptability'
};

/**
 * Extract canonical, deduplicated technical & domain keywords from JD string
 */
function extractKeywordsFromJD(jdText) {
  if (!jdText) return [];
  const lowerJD = jdText.toLowerCase();
  const canonicalMap = new Map(); // key (lowercase) -> canonical display name

  // 1. Direct segment extraction (split by comma, semicolon, newline, bullet points)
  const rawSegments = jdText.split(/[,;\n•\r|]/).map(s => s.trim().toLowerCase()).filter(s => s.length >= 2 && s.length <= 40);
  rawSegments.forEach(seg => {
    if (/^(responsibilities|requirements|qualifications|years|experience|preferred|must have|job description|technical skills|skills)$/i.test(seg)) return;
    
    if (CANONICAL_SKILLS_MAP[seg]) {
      const canonical = CANONICAL_SKILLS_MAP[seg];
      canonicalMap.set(canonical.toLowerCase(), canonical);
    } else if (seg.length >= 2 && seg.length <= 30) {
      // Capitalize first letter of each word
      const display = seg.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      canonicalMap.set(seg.toLowerCase(), display);
    }
  });

  // 2. Scan for master skills inside paragraphs of JD using word boundary regex
  Object.keys(CANONICAL_SKILLS_MAP).forEach((skillKey) => {
    // Escape special regex characters like +, #, ., etc.
    const escaped = skillKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');
    if (regex.test(lowerJD)) {
      const canonical = CANONICAL_SKILLS_MAP[skillKey];
      canonicalMap.set(canonical.toLowerCase(), canonical);
    }
  });

  return Array.from(canonicalMap.values());
}

/**
 * Check if a candidate profile genuinely possesses a target JD skill
 */
function isCandidateSkillMatched(targetSkill, parsedSkills = [], rawText = '') {
  const targetLower = targetSkill.toLowerCase().trim();
  const targetCanonical = CANONICAL_SKILLS_MAP[targetLower] || targetSkill;
  const targetCanonicalLower = targetCanonical.toLowerCase();

  // Normalize candidate's parsed skills list
  const candSkillsLower = parsedSkills.map(s => (s || '').toLowerCase().trim());
  const candCanonicalSkillsLower = candSkillsLower.map(s => (CANONICAL_SKILLS_MAP[s] || s).toLowerCase());

  // 1. Exact match against candidate skills or canonical candidate skills
  if (candSkillsLower.includes(targetLower) || candCanonicalSkillsLower.includes(targetCanonicalLower)) {
    return true;
  }

  // 2. Skill alias / sub-match checks (e.g. MySQL / PostgreSQL satisfies SQL)
  if (targetCanonicalLower === 'sql') {
    if (candSkillsLower.some(s => s === 'sql' || s === 'mysql' || s === 'postgresql' || s === 'postgres' || s === 'pl/sql' || s === 'sqlite' || s === 'mariadb')) {
      return true;
    }
  }
  if (targetCanonicalLower === 'react') {
    if (candSkillsLower.some(s => s === 'react' || s === 'react.js' || s === 'reactjs' || s === 'react native')) {
      return true;
    }
  }
  if (targetCanonicalLower === 'node.js') {
    if (candSkillsLower.some(s => s === 'node.js' || s === 'nodejs' || s === 'node')) {
      return true;
    }
  }
  if (targetCanonicalLower === 'javascript') {
    if (candSkillsLower.some(s => s === 'javascript' || s === 'js' || s === 'ecmascript')) {
      return true;
    }
  }
  if (targetCanonicalLower === 'typescript') {
    if (candSkillsLower.some(s => s === 'typescript' || s === 'ts')) {
      return true;
    }
  }
  if (targetCanonicalLower === 'java') {
    if (candSkillsLower.some(s => s === 'java' || s === 'core java' || s === 'j2ee' || s === 'spring')) {
      return true;
    }
  }

  // 3. Whole-word match in raw resume text with strict boundary and false-positive guards
  // For short tokens (<= 3 chars like 'c', 'r', 'go', 'js', 'ts'), DO NOT do loose text search unless in skills
  if (targetLower.length <= 3 && targetLower !== 'css' && targetLower !== 'sql' && targetLower !== 'aws' && targetLower !== 'git') {
    return false;
  }

  const escaped = targetLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const wordRegex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`, 'i');

  if (targetCanonicalLower === 'react') {
    // Must match 'react', 'react.js', 'reactjs' and NOT be part of 'reactive', 'reaction', 'interactive'
    const reactRegex = /(?:^|[^a-zA-Z0-9_])(react|react\.js|reactjs)(?:$|[^a-zA-Z0-9_])/i;
    return reactRegex.test(rawText);
  }

  if (targetCanonicalLower === 'java') {
    // Must match 'java' or 'core java' and NOT 'javascript'
    const javaRegex = /(?:^|[^a-zA-Z0-9_])(java|core\s+java)(?!\s*script)(?:$|[^a-zA-Z0-9_])/i;
    return javaRegex.test(rawText);
  }

  return wordRegex.test(rawText);
}

/**
 * Extract raw text from uploaded file buffer or path
 */
async function extractTextFromFile(filePath, mimeType, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const fileBuffer = await fs.promises.readFile(filePath);

  if (ext === '.pdf' || mimeType.includes('pdf')) {
    try {
      let text = '';
      const PDFClass = pdfModule.PDFParse || (pdfModule.default?.PDFParse);

      if (PDFClass) {
        const parser = new PDFClass({ data: fileBuffer });
        const data = await parser.getText();
        text = data.text?.trim() ?? '';
        if (typeof parser.destroy === 'function') await parser.destroy();
      } else if (typeof pdfModule === 'function') {
        const data = await pdfModule(fileBuffer);
        text = data.text?.trim() ?? '';
      } else if (typeof pdfModule.default === 'function') {
        const data = await pdfModule.default(fileBuffer);
        text = data.text?.trim() ?? '';
      }

      if (text && text.length >= 5) {
        return text;
      }
    } catch (e) {
      // Fallback if document has raw ASCII/UTF-8 text
      const textFallback = fileBuffer.toString('utf-8');
      if (textFallback && textFallback.trim().length > 10) {
        return textFallback;
      }
    }

    const textFallback = fileBuffer.toString('utf-8');
    if (textFallback && textFallback.trim().length > 10) {
      return textFallback;
    }
  }

  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      if (result && result.value && result.value.trim().length > 0) {
        return result.value;
      }
    } catch (e) {
      const textFallback = fileBuffer.toString('utf-8');
      if (textFallback && textFallback.trim().length > 10) {
        return textFallback;
      }
    }
  }

  if (ext === '.doc' || mimeType === 'application/msword') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
    } catch (e) {
      // Fallback binary text decoding
    }
    return fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  }

  return fileBuffer.toString('utf-8');
}

/**
 * Deterministic ATS Evaluation Calculator
 */
function calculateDeterministicAtsScore(parsed, rawText) {
  const lowerText = (rawText || '').toLowerCase();
  const textLength = (rawText || '').length;

  // 1. Contact (5%)
  let contactScore = 0;
  if (parsed.email) contactScore += 40;
  if (parsed.phone) contactScore += 30;
  if (parsed.fullName && parsed.fullName !== 'Candidate') contactScore += 20;
  if (parsed.location || parsed.linkedin || parsed.github) contactScore += 10;
  contactScore = Math.min(100, Math.max(0, contactScore));

  // 2. Skills (20%)
  const rawSkills = parsed.skills || [];
  const uniqueSkills = Array.from(new Set(rawSkills.map((s) => s.toLowerCase())));
  let skillsScore = 0;
  if (uniqueSkills.length === 0) skillsScore = 0;
  else if (uniqueSkills.length <= 2) skillsScore = 45;
  else if (uniqueSkills.length <= 5) skillsScore = 75;
  else if (uniqueSkills.length <= 9) skillsScore = 90;
  else skillsScore = 100;

  // 3. Experience (20%)
  const expItems = parsed.experience || [];
  let experienceScore = 0;
  if (expItems.length === 0) experienceScore = 0;
  else if (expItems.length === 1) experienceScore = 65;
  else if (expItems.length === 2) experienceScore = 85;
  else experienceScore = 100;

  const actionVerbCount = ACTION_VERBS.filter((verb) => lowerText.includes(verb)).length;
  if (actionVerbCount > 0 && expItems.length > 0) {
    experienceScore = Math.min(100, experienceScore + 10);
  }

  // 4. Education (15%)
  const eduItems = parsed.education || [];
  let educationScore = 0;
  if (eduItems.length === 0) {
    educationScore = 0;
  } else {
    const eduText = Array.isArray(eduItems) ? eduItems.join(' ').toLowerCase() : String(eduItems).toLowerCase();
    if (eduText.includes('master') || eduText.includes('m.tech') || eduText.includes('phd') || eduText.includes('m.s.')) {
      educationScore = 100;
    } else if (eduText.includes('bachelor') || eduText.includes('b.tech') || eduText.includes('degree') || eduText.includes('b.e.') || eduText.includes('b.s.')) {
      educationScore = 90;
    } else {
      educationScore = 75;
    }
  }

  // 5. Projects (10%)
  const projItems = parsed.projects || [];
  let projectsScore = 0;
  if (projItems.length === 0) projectsScore = 0;
  else if (projItems.length === 1) projectsScore = 60;
  else if (projItems.length === 2) projectsScore = 85;
  else projectsScore = 100;

  // 6. Certifications (5%)
  const certItems = parsed.certifications || [];
  let certificationsScore = certItems.length === 0 ? 40 : certItems.length === 1 ? 80 : 100;

  // 7. Achievements (5%)
  let achievementsScore = 50;
  if (/\d+%|\$\d+|\d+\s*years|\bfirst place\b|\bawarded\b/i.test(rawText)) achievementsScore += 30;
  if (actionVerbCount >= 3) achievementsScore += 20;
  achievementsScore = Math.min(100, achievementsScore);

  // 8. Keyword Score (10%)
  let keywordScore = uniqueSkills.length >= 8 ? 100 : uniqueSkills.length >= 5 ? 80 : uniqueSkills.length >= 2 ? 60 : 30;

  // 9. Structure Score (10%)
  let structureScore = 100;
  if (textLength < 200) structureScore -= 60;
  else if (textLength < 500) structureScore -= 20;
  if (expItems.length === 0) structureScore -= 15;
  if (eduItems.length === 0) structureScore -= 15;
  if (projItems.length === 0) structureScore -= 10;
  if (uniqueSkills.length === 0) structureScore -= 15;
  structureScore = Math.max(0, structureScore);

  // 10. Formatting Score (10%)
  let formattingScore = 90;
  if (/\uFFFD/.test(rawText) || rawText.includes('??')) formattingScore -= 20;
  if (textLength > 5000) formattingScore -= 15;

  const atsScore = Math.round(
    skillsScore * 0.20 +
    experienceScore * 0.20 +
    educationScore * 0.15 +
    projectsScore * 0.10 +
    structureScore * 0.10 +
    keywordScore * 0.10 +
    achievementsScore * 0.05 +
    certificationsScore * 0.05 +
    contactScore * 0.05 +
    formattingScore * 0.10
  );

  return Math.min(100, Math.max(0, atsScore));
}

/**
 * Process a single candidate resume against Job Description
 */
async function processCandidateResume(file, jobDescription, userId) {
  const filePath = file.path;
  const originalName = file.originalname || path.basename(filePath);
  const mimeType = file.mimetype;

  // 1. Extract Raw Text
  const rawText = await extractTextFromFile(filePath, mimeType, originalName);
  if (!rawText || rawText.trim().length < 10) {
    throw new Error('Could not extract readable text from resume document.');
  }

  // 2. Parse candidate structured details
  const parsed = parseCandidateDetails(rawText);

  // 3. Compute ATS Score
  const atsScore = calculateDeterministicAtsScore(parsed, rawText);

  // 4. Job Description Match Analysis (Canonical, Deduplicated, Accurate)
  const jdKeywords = extractKeywordsFromJD(jobDescription);
  const matchedSkills = [];
  const missingSkills = [];
  const matchedKeywords = [];
  const missingKeywords = [];

  jdKeywords.forEach((kw) => {
    const isMatched = isCandidateSkillMatched(kw, parsed.skills || [], rawText);

    if (isMatched) {
      matchedKeywords.push(kw);
      matchedSkills.push(kw);
    } else {
      missingKeywords.push(kw);
      missingSkills.push(kw);
    }
  });

  // Calculate Match Sub-scores
  const skillMatchScore = jdKeywords.length > 0
    ? Math.round((matchedSkills.length * 100) / jdKeywords.length)
    : 80;

  const expCount = parsed.experience?.length || 0;
  let experienceMatchScore = 50;
  if (expCount >= 3) experienceMatchScore = 95;
  else if (expCount === 2) experienceMatchScore = 80;
  else if (expCount === 1) experienceMatchScore = 65;

  const eduCount = parsed.education?.length || 0;
  const educationMatchScore = eduCount > 0 ? 90 : 50;

  const projCount = parsed.projects?.length || 0;
  const projectMatchScore = projCount >= 2 ? 90 : projCount === 1 ? 70 : 40;

  const certCount = parsed.certifications?.length || 0;
  const certificationMatchScore = certCount > 0 ? 90 : 60;

  // Composite Job Match Score (0 - 100)
  const jobMatchScore = Math.round(
    skillMatchScore * 0.40 +
    experienceMatchScore * 0.20 +
    projectMatchScore * 0.15 +
    educationMatchScore * 0.15 +
    certificationMatchScore * 0.10
  );

  // Strengths, Weaknesses, Recommendations
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (matchedKeywords.length > 0) {
    strengths.push(`Matches ${matchedKeywords.length} required keywords: ${matchedKeywords.slice(0, 5).join(', ')}.`);
  }
  if (expCount >= 2) {
    strengths.push('Strong demonstrated professional work background.');
  }
  if (projCount >= 2) {
    strengths.push('Multiple practical projects demonstrating hands-on technical abilities.');
  }

  if (missingSkills.length > 0) {
    weaknesses.push(`Missing ${missingSkills.length} key JD skills: ${missingSkills.slice(0, 4).join(', ')}.`);
    recommendations.push(`Evaluate candidate capability on missing technical areas: ${missingSkills.slice(0, 3).join(', ')}.`);
  }
  if (expCount === 0) {
    recommendations.push('Candidate is entry-level / fresher; assess foundational problem-solving and rapid learning potential.');
  }

  // Create or link Resume record in MongoDB for user reference
  let savedResumeId = null;
  try {
    const resumeDoc = await Resume.create({
      user: userId,
      fileName: file.filename || path.basename(filePath),
      originalName,
      fileType: mimeType || 'application/pdf',
      fileSize: file.size || (await fs.promises.stat(filePath)).size,
      uploadPath: filePath,
      uploadDate: new Date(),
      status: 'uploaded',
      parsedText: rawText,
      parsedData: parsed,
      parseStatus: 'parsed',
      parsedAt: new Date()
    });
    savedResumeId = resumeDoc._id;
  } catch (err) {
    console.warn('⚠️ Could not create individual Resume document:', err.message);
  }

  return {
    resumeId: savedResumeId,
    fileName: file.filename || path.basename(filePath),
    originalName,
    candidateName: parsed.fullName || 'Candidate',
    email: parsed.email || '',
    phone: parsed.phone || '',
    location: parsed.location || '',
    atsScore,
    jobMatchScore,
    skillMatchScore,
    experienceMatchScore,
    educationMatchScore,
    projectMatchScore,
    certificationMatchScore,
    matchedSkills: Array.from(new Set(matchedSkills)),
    missingSkills: Array.from(new Set(missingSkills)),
    matchedKeywords: Array.from(new Set(matchedKeywords)),
    missingKeywords: Array.from(new Set(missingKeywords)),
    strengths,
    weaknesses,
    recommendations,
    parsedData: parsed,
    status: 'completed'
  };
}

/**
 * Multiple Resume Ranking Pipeline
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.jobTitle
 * @param {string} params.companyName
 * @param {string} params.jobDescription
 * @param {Array<Object>} params.files
 * @param {Object} [params.customWeights]
 * @returns {Promise<Object>} Saved CandidateRanking document
 */
export const rankMultipleResumesService = async ({
  userId,
  jobTitle,
  companyName = 'Target Company',
  jobDescription,
  files = [],
  customWeights = {}
}) => {
  if (!jobTitle || jobTitle.trim().length === 0) {
    throw new ApiError(400, 'Please provide a valid Job Title.');
  }

  if (!jobDescription || jobDescription.trim().length < 5) {
    throw new ApiError(400, 'Please provide a valid Job Description or target skills list (at least 5 characters).');
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, 'Please upload at least one resume file to rank.');
  }

  // Configurable Weights Normalization (Default: ATS 30%, JobMatch 40%, Skill 15%, Exp 10%, Edu 5%)
  let wAts = typeof customWeights.atsWeight === 'number' ? customWeights.atsWeight : 0.30;
  let wJob = typeof customWeights.jobMatchWeight === 'number' ? customWeights.jobMatchWeight : 0.40;
  let wSkill = typeof customWeights.skillWeight === 'number' ? customWeights.skillWeight : 0.15;
  let wExp = typeof customWeights.experienceWeight === 'number' ? customWeights.experienceWeight : 0.10;
  let wEdu = typeof customWeights.educationWeight === 'number' ? customWeights.educationWeight : 0.05;

  const totalWeight = wAts + wJob + wSkill + wExp + wEdu;
  if (totalWeight > 0) {
    wAts = Number((wAts / totalWeight).toFixed(4));
    wJob = Number((wJob / totalWeight).toFixed(4));
    wSkill = Number((wSkill / totalWeight).toFixed(4));
    wExp = Number((wExp / totalWeight).toFixed(4));
    wEdu = Number((wEdu / totalWeight).toFixed(4));
  }

  const weights = {
    atsWeight: wAts,
    jobMatchWeight: wJob,
    skillWeight: wSkill,
    experienceWeight: wExp,
    educationWeight: wEdu
  };

  console.log(`📊 [Recruiter] Processing ${files.length} resumes for '${jobTitle}' at '${companyName}'...`);

  const candidateResults = [];
  let processedCount = 0;
  let failedCount = 0;

  // Process all files with isolated error resilience (partial failure handling)
  for (const file of files) {
    try {
      const candidateResult = await processCandidateResume(file, jobDescription, userId);

      // Overall Candidate Score Calculation
      const overallScore = Math.round(
        candidateResult.atsScore * wAts +
        candidateResult.jobMatchScore * wJob +
        candidateResult.skillMatchScore * wSkill +
        candidateResult.experienceMatchScore * wExp +
        candidateResult.educationMatchScore * wEdu
      );

      candidateResult.overallScore = Math.min(100, Math.max(0, overallScore));
      candidateResults.push(candidateResult);
      processedCount++;
    } catch (err) {
      console.error(`⚠️ Failed to process resume file '${file.originalname || file.path}':`, err.message);
      failedCount++;
      candidateResults.push({
        fileName: file.filename || path.basename(file.path),
        originalName: file.originalname || path.basename(file.path),
        candidateName: 'Failed File',
        email: '',
        phone: '',
        atsScore: 0,
        jobMatchScore: 0,
        skillMatchScore: 0,
        experienceMatchScore: 0,
        educationMatchScore: 0,
        overallScore: 0,
        rank: 999,
        status: 'failed',
        error: err.message || 'File processing or parsing failed.'
      });
    }
  }

  // Sort Completed Candidates:
  // 1. overallScore DESC
  // 2. Tie-breaker 1: jobMatchScore DESC
  // 3. Tie-breaker 2: atsScore DESC
  // 4. Tie-breaker 3: candidateName ASC
  const completedCandidates = candidateResults
    .filter((c) => c.status === 'completed')
    .sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      if (b.jobMatchScore !== a.jobMatchScore) {
        return b.jobMatchScore - a.jobMatchScore;
      }
      if (b.atsScore !== a.atsScore) {
        return b.atsScore - a.atsScore;
      }
      return (a.candidateName || '').localeCompare(b.candidateName || '');
    });

  // Assign Ranks (1, 2, 3...)
  completedCandidates.forEach((candidate, idx) => {
    candidate.rank = idx + 1;
  });

  const failedCandidates = candidateResults.filter((c) => c.status === 'failed');
  const finalCandidatesList = [...completedCandidates, ...failedCandidates];

  // Save CandidateRanking Document in MongoDB
  const rankingSession = await CandidateRanking.create({
    userId,
    jobTitle: jobTitle.trim(),
    companyName: companyName.trim() || 'Target Company',
    jobDescription: jobDescription.trim(),
    weights,
    totalResumes: files.length,
    processedCount,
    failedCount,
    candidates: finalCandidatesList
  });

  console.log(`✅ [Recruiter] Ranking completed: ${processedCount} processed, ${failedCount} failed. Session ID: ${rankingSession._id}`);

  return rankingSession;
};

/**
 * Get all ranking sessions for a recruiter/admin with pagination & search
 */
export const getRecruiterRankingsService = async (userId, userRole, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const search = query.search || '';

  const filter = {};
  // Non-superadmins see only their own ranking sessions
  if (userRole !== 'admin') {
    filter.userId = userId;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { jobTitle: regex },
      { companyName: regex }
    ];
  }

  const total = await CandidateRanking.countDocuments(filter);
  const rankings = await CandidateRanking.find(filter)
    .select('jobTitle companyName totalResumes processedCount failedCount createdAt candidates')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Format summaries
  const summaries = rankings.map((r) => {
    const topCandidate = (r.candidates || []).find((c) => c.rank === 1);
    return {
      _id: r._id,
      jobTitle: r.jobTitle,
      companyName: r.companyName,
      totalResumes: r.totalResumes,
      processedCount: r.processedCount,
      failedCount: r.failedCount,
      createdAt: r.createdAt,
      topCandidate: topCandidate ? {
        name: topCandidate.candidateName,
        overallScore: topCandidate.overallScore,
        atsScore: topCandidate.atsScore,
        jobMatchScore: topCandidate.jobMatchScore
      } : null
    };
  });

  return {
    rankings: summaries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Get detailed ranking session by ID
 */
export const getRankingByIdService = async (id, userId, userRole) => {
  const ranking = await CandidateRanking.findById(id);
  if (!ranking) {
    throw new ApiError(404, 'Candidate ranking report not found.');
  }

  if (userRole !== 'admin' && ranking.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to view this ranking report.');
  }

  return ranking;
};

/**
 * Delete a ranking session by ID
 */
export const deleteRankingService = async (id, userId, userRole) => {
  const ranking = await CandidateRanking.findById(id);
  if (!ranking) {
    throw new ApiError(404, 'Candidate ranking report not found.');
  }

  if (userRole !== 'admin' && ranking.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to delete this ranking report.');
  }

  await CandidateRanking.deleteOne({ _id: id });
  return { id };
};
