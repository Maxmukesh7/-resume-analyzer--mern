import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import nlp from 'compromise';
import Resume from '../models/Resume.js';
import ApiError from '../utils/apiError.js';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const pdfParse = typeof pdfModule === 'function' ? pdfModule : (pdfModule.PDFParse || pdfModule.default);

// Technical Skills Dictionary for Keyword Extraction
const SKILLS_DICT = [
  'JavaScript', 'TypeScript', 'React', 'React.js', 'ReactJS', 'Node.js', 'NodeJS', 'Express', 'Express.js',
  'MongoDB', 'Mongoose', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Rails', 'HTML', 'HTML5',
  'CSS', 'CSS3', 'Sass', 'Tailwind', 'TailwindCSS', 'Bootstrap', 'SQL', 'MySQL', 'PostgreSQL', 'SQLite',
  'Git', 'GitHub', 'GitLab', 'AWS', 'Amazon Web Services', 'Docker', 'Kubernetes', 'REST', 'RESTful API',
  'GraphQL', 'Next.js', 'NextJS', 'Vue', 'Vue.js', 'Angular', 'Redux', 'Zustand', 'Linux', 'Unix',
  'Redis', 'Flask', 'Django', 'Spring', 'Spring Boot', 'Figma', 'Agile', 'Scrum', 'JIRA', 'CI/CD',
  'Jest', 'Cypress', 'Mocha', 'Chai', 'Webpack', 'Vite', 'Firebase', 'Supabase', 'WebSockets'
];

/**
 * Extract raw plain text from PDF or DOCX file
 * @param {string} filePath - Absolute path to physical file
 * @param {string} mimeType - File mimetype
 * @param {string} originalName - Original filename
 * @returns {Promise<string>} Extracted raw text string
 */
export const extractRawText = async (filePath, mimeType, originalName = '') => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Resume file not found at path: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Uploaded resume file is empty (0 bytes).');
  }

  const ext = path.extname(originalName || filePath).toLowerCase();

  // PDF Extraction
  if (mimeType.includes('pdf') || ext === '.pdf') {
    try {
      let text = '';
      if (typeof pdfModule === 'function') {
        const data = await pdfModule(fileBuffer);
        text = data.text ? data.text.trim() : '';
      } else if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: fileBuffer });
        const data = await parser.getText();
        text = data.text ? data.text.trim() : '';
      } else if (pdfModule.default && typeof pdfModule.default === 'function') {
        const data = await pdfModule.default(fileBuffer);
        text = data.text ? data.text.trim() : '';
      }

      if (!text) {
        throw new Error('PDF file contains no extractable text or is image-based.');
      }
      return text;
    } catch (err) {
      if (err.message?.includes('no extractable text')) throw err;
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }
  }

  // DOCX Extraction
  if (mimeType.includes('openxmlformats') || mimeType.includes('wordprocessingml') || ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value ? result.value.trim() : '';
      if (!text) {
        throw new Error('DOCX file contains no extractable text.');
      }
      return text;
    } catch (err) {
      if (err.message?.includes('no extractable text')) throw err;
      throw new Error(`Failed to parse DOCX document: ${err.message}`);
    }
  }

  // Legacy DOC Format Error
  if (mimeType.includes('msword') || ext === '.doc') {
    throw new Error('Legacy binary DOC format is not supported for text parsing. Please convert your file to PDF or DOCX format.');
  }

  throw new Error(`Unsupported file type (${mimeType}). Only PDF and DOCX files can be parsed.`);
};

/**
 * Parse structured candidate details from raw resume text using Regex & Compromise NLP
 * @param {string} rawText - Extracted text string
 * @returns {Object} Structured candidate information
 */
export const parseCandidateDetails = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      fullName: '',
      email: '',
      phone: '',
      summary: '',
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      languages: [],
      linkedin: '',
      github: '',
      portfolio: '',
      location: ''
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // 1. Email Address
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : '';

  // 2. Phone Number
  const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const phoneMatch = rawText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // 3. URLs (LinkedIn, GitHub, Portfolio)
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
  const linkedinMatch = rawText.match(linkedinRegex);
  const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';

  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/gi;
  const githubMatch = rawText.match(githubRegex);
  const github = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '';

  const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.(?:vercel\.app|netlify\.app|github\.io|me|io|dev)/gi;
  const portfolioMatch = rawText.match(portfolioRegex);
  const portfolio = portfolioMatch ? (portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`) : '';

  // 4. Full Name (Try top 5 lines or Compromise NLP)
  let fullName = '';
  const doc = nlp(rawText);
  const people = doc.people().out('array');

  if (people && people.length > 0) {
    const candidateName = people.find(
      (p) => p.length >= 3 && !p.toLowerCase().includes('resume') && !p.toLowerCase().includes('curriculum')
    );
    if (candidateName) fullName = candidateName;
  }

  if (!fullName && lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 50 && !firstLine.includes('@') && !firstLine.includes('http')) {
      fullName = firstLine.replace(/[^a-zA-Z\s.]/g, '').trim();
    }
  }

  // 5. Skills (Match against dictionary)
  const skillsSet = new Set();
  SKILLS_DICT.forEach((skill) => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(rawText)) {
      skillsSet.add(skill);
    }
  });
  const skills = Array.from(skillsSet);

  // 6. Section Parsing (Summary, Education, Experience, Projects, Certifications, Languages)
  const sections = {
    summary: [],
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    languages: [],
    location: ''
  };

  const sectionKeywords = {
    summary: [
      'professional summary',
      'summary',
      'career summary',
      'profile summary',
      'objective',
      'career objective',
      'about me',
      'profile',
      'executive summary',
      'personal summary',
      'professional profile',
      'career profile',
      'personal statement'
    ],
    education: ['education', 'academic background', 'qualification', 'qualifications', 'academic history'],
    experience: ['experience', 'work experience', 'employment history', 'work history', 'professional experience', 'employment'],
    projects: ['projects', 'personal projects', 'key projects', 'academic projects'],
    skills: ['skills', 'technical skills', 'core competencies', 'technologies'],
    certifications: ['certifications', 'certificates', 'licenses', 'courses'],
    languages: ['languages', 'language skills', 'spoken languages']
  };

  let currentSection = null;

  lines.forEach((line) => {
    const cleanLine = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // Check if line is a section header
    let matchedHeader = null;
    for (const [secKey, keywords] of Object.entries(sectionKeywords)) {
      for (const kw of keywords) {
        if (cleanLine === kw || (cleanLine.startsWith(kw) && line.length <= 45)) {
          matchedHeader = secKey;
          break;
        }
      }
      if (matchedHeader) break;
    }

    if (matchedHeader) {
      currentSection = matchedHeader;
      // Handle inline content after colon/dash e.g. "Professional Summary: Experienced engineer..."
      const inlineSplit = line.split(/:(.+)|-(.+)/);
      if (inlineSplit && inlineSplit[1] && inlineSplit[1].trim().length > 10) {
        sections[matchedHeader].push(inlineSplit[1].trim());
      }
      return;
    }

    if (currentSection) {
      if (line.length > 2) {
        if (currentSection === 'summary') {
          // Limit summary section to first 6 lines or ~1500 chars
          if (sections.summary.length < 6) {
            sections.summary.push(line);
          }
        } else if (currentSection !== 'location' && Array.isArray(sections[currentSection])) {
          if (sections[currentSection].length < 15) {
            sections[currentSection].push(line);
          }
        }
      }
    }
  });

  // Extract Summary string
  let extractedSummary = sections.summary.join(' ').replace(/\s+/g, ' ').trim();

  // Fallback: If no explicit summary header was matched, inspect top lines (before any major section header)
  if (!extractedSummary) {
    const topLines = lines.slice(1, 8);
    const candidateSummaryLines = [];
    const allKeywords = Object.values(sectionKeywords).flat();

    for (const line of topLines) {
      const cleanLine = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      
      // Stop fallback if we hit any major section header (e.g. Skills, Experience, Education)
      if (allKeywords.includes(cleanLine) || /^(skills|experience|education|projects|certifications|languages)$/i.test(cleanLine)) {
        break;
      }

      const lower = line.toLowerCase();
      // Skip contact details, links, locations, or short lines
      if (
        lower.includes('@') ||
        lower.includes('http') ||
        lower.includes('linkedin') ||
        lower.includes('github') ||
        phoneRegex.test(line) ||
        line.length < 35
      ) {
        continue;
      }
      // Check if line looks like a descriptive professional summary paragraph
      if (/developer|engineer|professional|experienced|proficient|passionate|seeking|building|graduated|architect|specialist/i.test(line)) {
        candidateSummaryLines.push(line);
      }
    }
    if (candidateSummaryLines.length > 0) {
      extractedSummary = candidateSummaryLines.join(' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Extract Location (Look for "City, Country" or Compromise NLP places)
  const places = doc.places().out('array');
  let location = places && places.length > 0 ? places[0] : '';
  if (!location) {
    const locationRegex = /(?:Location|Address|City):\s*([a-zA-Z\s,]+)/i;
    const locMatch = rawText.match(locationRegex);
    if (locMatch) location = locMatch[1].trim();
  }

  // Extract Common Languages if empty
  if (sections.languages.length === 0) {
    const commonLangs = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Tamil', 'Mandarin', 'Japanese'];
    commonLangs.forEach((lang) => {
      if (new RegExp(`\\b${lang}\\b`, 'i').test(rawText)) {
        sections.languages.push(lang);
      }
    });
  }

  return {
    fullName: fullName || 'Candidate',
    email,
    phone,
    summary: extractedSummary,
    skills,
    education: sections.education,
    experience: sections.experience,
    projects: sections.projects,
    certifications: sections.certifications,
    languages: sections.languages,
    linkedin,
    github,
    portfolio,
    location
  };
};

/**
 * Main service orchestrator: Extract text, parse candidate details, and update MongoDB document
 * Avoids re-parsing if resume has already been successfully parsed with summary.
 * @param {string} resumeId - Database record ID
 * @param {boolean} forceReparse - Force re-parsing even if already parsed
 * @returns {Promise<Object>} Updated resume document with parsedData & parsedText
 */
export const parseAndSaveResume = async (resumeId, forceReparse = false) => {
  const resume = await Resume.findById(resumeId);

  if (!resume) {
    throw new ApiError(404, 'Resume record not found.');
  }

  // Auto-upgrade legacy records: if parsedData is missing summary property, force re-parse from parsedText
  const needsSummaryBackfill = resume.parseStatus === 'parsed' && resume.parsedData && typeof resume.parsedData.summary !== 'string';

  if (!forceReparse && !needsSummaryBackfill && resume.parseStatus === 'parsed' && resume.parsedData && resume.parsedData.fullName) {
    console.log(`ℹ️ [DEBUG] Resume ${resumeId} is already parsed with summary. Returning cached parsed data.`);
    return resume;
  }

  // Set status to parsing
  resume.parseStatus = 'parsing';
  resume.parseError = '';
  await resume.save();

  try {
    let rawText = resume.parsedText;

    if (!rawText || forceReparse) {
      const filePath = path.isAbsolute(resume.uploadPath)
        ? resume.uploadPath
        : path.join(process.cwd(), resume.uploadPath);

      console.log(`⚙️ [DEBUG] Extracting raw text from file: ${filePath} (${resume.fileType})`);
      rawText = await extractRawText(filePath, resume.fileType, resume.originalName);
    }

    console.log(`⚙️ [DEBUG] Parsing candidate information from extracted text (${rawText.length} characters)...`);
    const parsedData = parseCandidateDetails(rawText);

    resume.parsedText = rawText;
    resume.parsedData = parsedData;
    resume.parsedAt = new Date();
    resume.parseStatus = 'parsed';
    resume.parseError = '';

    await resume.save();
    console.log(`✅ [DEBUG] Successfully parsed & updated Resume ID ${resume._id} in MongoDB! Summary extracted: "${parsedData.summary ? parsedData.summary.slice(0, 60) + '...' : 'None'}"`);

    return resume;
  } catch (error) {
    console.error(`💥 [DEBUG] Parsing failed for Resume ID ${resumeId}:`, error.message);
    resume.parseStatus = 'failed';
    resume.parseError = error.message || 'Failed to extract and parse resume content.';
    await resume.save();
    throw new ApiError(400, `Resume parsing failed: ${error.message}`);
  }
};
