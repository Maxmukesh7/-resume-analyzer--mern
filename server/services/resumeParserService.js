/**
 * ============================================================
 * RESUME PARSER SERVICE — AI Resume Analyzer
 * ============================================================
 *
 * Pipeline:
 *   1. extractRawText()       — PDF / DOCX → raw string
 *   2. cleanText()            — normalize, strip noise
 *   3. segmentSections()      — identify named sections
 *   4. extractFields()        — per-section structured data
 *   5. validateOutput()       — strict field validation
 *   6. parseCandidateDetails()— public entry point → strict JSON
 *   7. parseAndSaveResume()   — orchestrator → MongoDB
 *
 * Rules enforced:
 *   • Never invent data (no fake experience, no inferred location)
 *   • Extract ALL projects (no truncation at first project)
 *   • Location must be city/state/country from header only
 *   • Skills deduplicated and normalized
 *   • Every array returns [] when empty (never null)
 *   • location returns null when absent
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import nlp from 'compromise';
import Resume from '../models/Resume.js';
import ApiError from '../utils/apiError.js';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

// ─────────────────────────────────────────────────────────────────────────────
// DICTIONARIES
// ─────────────────────────────────────────────────────────────────────────────

const TECH_SKILLS = [
  // Languages
  'JavaScript','TypeScript','Python','Java','C','C++','C#','PHP','Ruby','Go','Golang',
  'Rust','Swift','Kotlin','Scala','R','MATLAB','Bash','Shell','PowerShell','Perl',
  'Dart','Lua','Haskell','Elixir','Groovy','Assembly','SQL','PL/SQL','T-SQL',
  // Frontend
  'React','ReactJS','Vue','Angular','Next.js','Nuxt.js','Svelte','HTML','HTML5','CSS',
  'CSS3','Sass','SCSS','Less','Tailwind CSS','Bootstrap','Material UI','Chakra UI',
  'Ant Design','jQuery','Redux','Zustand','MobX','Vite','Webpack','Babel','Parcel',
  // Backend
  'Node.js','Express','Express.js','NestJS','Fastify','Django','Flask','FastAPI',
  'Spring','Spring Boot','Laravel','Rails','ASP.NET','.NET','Gin','Fiber','Koa',
  // Databases
  'MongoDB','MySQL','PostgreSQL','SQLite','MariaDB','Oracle','Redis','Cassandra',
  'DynamoDB','Elasticsearch','Firebase','Supabase','InfluxDB','Neo4j',
  'Prisma','Sequelize','TypeORM','Mongoose','GraphQL','Apollo',
  // Cloud & DevOps
  'AWS','Azure','GCP','Google Cloud','Heroku','Vercel','Netlify','DigitalOcean',
  'Docker','Kubernetes','Terraform','Ansible','Jenkins','GitHub Actions','GitLab CI',
  'CircleCI','Travis CI','CI/CD','Nginx','Apache','Linux','Unix','Cloudflare',
  // APIs & Messaging
  'REST','RESTful API','gRPC','WebSockets','Socket.io','OAuth','JWT','OpenAPI',
  'Swagger','Microservices','RabbitMQ','Kafka','Message Queues',
  // Tools & Testing
  'Git','GitHub','GitLab','Bitbucket','JIRA','Confluence','Figma','Postman',
  'VS Code','IntelliJ','Eclipse','Jest','Mocha','Chai','Cypress','Playwright',
  'Selenium','Vitest','pytest','JUnit','Testing Library',
  // AI / Data
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Keras','scikit-learn',
  'Pandas','NumPy','Matplotlib','NLP','OpenCV','Hugging Face','Data Science',
  'Data Analysis','Spark','Hadoop','Tableau','Power BI',
  // Practices
  'Agile','Scrum','Kanban','TDD','BDD','OOP','Functional Programming',
  'Design Patterns','System Design','Data Structures','Algorithms',
];

const SOFT_SKILLS = [
  'Communication','Leadership','Problem Solving','Teamwork','Critical Thinking',
  'Time Management','Adaptability','Collaboration','Project Management',
  'Emotional Intelligence','Conflict Resolution','Mentorship','Decision Making',
  'Work Ethic','Creativity','Attention to Detail','Analytical Skills',
  'Interpersonal Skills','Organizational Skills','Self-Motivation','Flexibility',
  'Negotiation','Strategic Planning','Presentation Skills','Multitasking',
];

const ALL_SKILLS = [...TECH_SKILLS, ...SOFT_SKILLS];

/** Canonical skill names — maps raw/alias → canonical */
const SKILL_CANON = {
  reactjs: 'React', 'react.js': 'React', 'react js': 'React',
  nodejs: 'Node.js', 'node.js': 'Node.js', node: 'Node.js',
  expressjs: 'Express', 'express.js': 'Express',
  vuejs: 'Vue', 'vue.js': 'Vue',
  angularjs: 'Angular', 'angular.js': 'Angular',
  nextjs: 'Next.js', 'next.js': 'Next.js',
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  py: 'Python', python: 'Python',
  postgres: 'PostgreSQL', postgresql: 'PostgreSQL',
  mongo: 'MongoDB', mongodb: 'MongoDB',
  aws: 'AWS', 'amazon web services': 'AWS',
  tailwind: 'Tailwind CSS', tailwindcss: 'Tailwind CSS',
  html5: 'HTML', html: 'HTML',
  css3: 'CSS', css: 'CSS',
  golang: 'Go', cpp: 'C++', 'c#': 'C#', csharp: 'C#',
  'node js': 'Node.js', 'express js': 'Express',
};

function canonicalSkill(raw) {
  const key = raw.toLowerCase().trim();
  return SKILL_CANON[key] || raw.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION ALIAS MAP
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_MAP = {
  summary: [
    'summary','professional summary','career summary','profile summary','executive summary',
    'personal summary','professional profile','career profile','personal statement',
    'career objective','objective','about me','about','profile','overview',
    'introduction','professional overview','bio','background','summary of qualifications',
    'qualifications summary','career overview','personal profile','profile statement',
    'executive profile','career goal','professional bio','synopsis','brief overview',
    'career aim','statement of purpose','candidature summary','core qualifications',
    'summary statement','profile & summary','professional summary & objective','profile objective',
    'professional background summary'
  ],
  experience: [
    'experience','work experience','professional experience','employment history',
    'employment','work history','career history','internship','internships',
    'internship experience','job experience','industry experience','relevant experience',
    'professional background','work record','career progression','positions held',
    'employment record','experience highlights','work & experience',
  ],
  projects: [
    'projects','key projects','academic projects','personal projects','major projects',
    'notable projects','project highlights','project work','project portfolio',
    'portfolio','open source projects','open source','side projects',
    'capstone projects','featured projects','technical projects','selected projects',
  ],
  education: [
    'education','academic background','academic qualification','academic qualifications',
    'qualification','qualifications','academic history','educational background',
    'academics','academic details','scholastic record','education & training',
    'education and training','degrees','academic profile',
  ],
  skills: [
    'skills','technical skills','core skills','key skills','core competencies',
    'competencies','technologies','tech stack','programming languages',
    'languages and technologies','technical expertise','expertise',
    'tools and technologies','tools','technology stack','skill set','proficiencies',
    'areas of expertise','domain skills','software skills','technical proficiencies',
    'skills & tools','tools & frameworks','skills and tools',
  ],
  softSkills: [
    'soft skills','interpersonal skills','professional skills','leadership skills',
    'personal skills','core strengths','strengths','key strengths',
  ],
  certifications: [
    'certifications','certificates','certification','certificate','licenses',
    'professional certifications','courses','online courses',
    'training and certifications','professional development','credentials',
    'courses & credentials','credentials & courses','certifications & licenses',
    'certifications & training','license & certifications','courses and credentials',
    'certifications and licenses','workshops & training','workshops and training',
    'workshops','trainings & workshops','workshops & certifications',
  ],
  achievements: [
    'achievements','awards','accomplishments','honors','recognition',
    'awards and recognition','awards and achievements','honors and awards',
    'accomplishments and awards','key achievements',
  ],
  languages: [
    'languages','language skills','spoken languages','language proficiency',
    'languages spoken','spoken language','languages known',
  ],
};

// Flat reverse lookup: alias_string → section_key
const ALIAS_LOOKUP = new Map();
for (const [section, aliases] of Object.entries(SECTION_MAP)) {
  for (const alias of aliases) {
    ALIAS_LOOKUP.set(alias.toLowerCase(), section);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — CLEAN TEXT
// ─────────────────────────────────────────────────────────────────────────────

function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\f/g, '\n')                           // form-feed → newline
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')  // zero-width & nbsp
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')     // e.g. -- 1 of 1 --
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')        // page numbers
    .replace(/Page\s+\d+/gi, '')
    .replace(/[ \t]{2,}/g, ' ')                    // collapse horizontal space
    .split('\n')
    .map(l => l.trimEnd())
    .filter(l => l.trim().length > 0)
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — SECTION SEGMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a line for section-header matching:
 * strips bullet chars, trailing punctuation, collapses spaces, lowercases.
 */
function normaliseHeading(line) {
  return line
    .replace(/^[\s•▪■▶►*\-=|#>◆◇→●★_~]+/, '')
    .replace(/[:;.\s\-–—|]+$/, '')
    .replace(/[^a-zA-Z0-9\s&'/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Returns the section key if the line is a recognised section heading,
 * otherwise returns null.
 *
 * Heuristic: the normalised line must be ≤ 80 chars and must not look
 * like a sentence (no terminating period/! after text).
 */
function detectSection(line) {
  if (!line || line.trim().length < 2) return null;

  const trimmed = line.trim();
  if (trimmed.length > 90) return null;

  // 1. Direct normalise heading check
  const norm = normaliseHeading(trimmed);
  if (norm && norm.length >= 2) {
    if (ALIAS_LOOKUP.has(norm)) return ALIAS_LOOKUP.get(norm);

    for (const [alias, section] of ALIAS_LOOKUP.entries()) {
      if (norm.length <= alias.length + 15 && norm.startsWith(alias)) {
        return section;
      }
    }
  }

  // 2. Check if line starts with a section heading before a delimiter (colon, dash, pipe)
  // e.g. "Summary: Experienced software engineer...", "Skills - Python, Java...", "Profile | Full Stack Developer"
  const delimiterMatch = trimmed.match(/^([^:\-–—|•]{2,35})[:\-–—|]\s*(.+)$/);
  if (delimiterMatch) {
    const prefix = normaliseHeading(delimiterMatch[1]);
    if (prefix && ALIAS_LOOKUP.has(prefix)) {
      return ALIAS_LOOKUP.get(prefix);
    }
    for (const [alias, section] of ALIAS_LOOKUP.entries()) {
      if (prefix && prefix.length <= alias.length + 10 && prefix.startsWith(alias)) {
        return section;
      }
    }
  }

  return null;
}

/**
 * Splits the cleaned text into named sections.
 * Returns an object: { summary: string[], experience: string[], ... }
 */
function segmentSections(cleanedText) {
  const buckets = {
    header: [],      // top contact block
    summary: [],
    experience: [],
    projects: [],
    education: [],
    skills: [],
    softSkills: [],
    certifications: [],
    achievements: [],
    languages: [],
    _other: [],
  };

  const lines = cleanedText.split('\n');
  let currentSection = 'header';
  let headerFinished = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    const detected = detectSection(trimmed);

    if (detected && buckets[detected] !== undefined) {
      currentSection = detected;
      headerFinished = true;

      // Handle "SKILLS: React, Node.js, ..." or "Summary: Passionate developer..." on the same line
      const delimiterMatch = trimmed.match(/^[^:\-–—|]{2,35}[:\-–—|]\s*(.+)$/);
      if (delimiterMatch && delimiterMatch[1]) {
        const afterDelimiter = delimiterMatch[1].trim();
        if (afterDelimiter.length > 1) {
          buckets[detected].push(afterDelimiter);
        }
      }
      continue;
    }

    // First N lines before any section heading = header (contact block)
    if (!headerFinished) {
      buckets.header.push(trimmed);
      // Stop treating lines as header once we've seen enough contact lines
      if (buckets.header.length >= 10) headerFinished = true;
      continue;
    }

    buckets[currentSection].push(trimmed);
  }

  return buckets;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — REGEX HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const RE_EMAIL   = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const RE_PHONE   = /(?:(?:\+?\d{1,4}[\s.\-]?)?\(?\d{2,5}\)?[\s.\-]\d{3,5}[\s.\-]?\d{3,5}|\+\d{1,4}[\s.\-]?\d{3,5}[\s.\-]?\d{3,5}|\b[6-9]\d{9}\b|\b\d{10,12}\b)/;
const RE_LINKEDIN= /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-]+\/?/i;
const RE_GITHUB  = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-]+\/?/i;
const RE_DATE_RANGE = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)?\s*['''`]?\d{2,4}\s*[-–—to]+\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)?\s*['''`]?(?:\d{2,4}|present|current|now)\b/i;
const RE_YEAR    = /\b(19|20)\d{2}\b/g;
const RE_GRADE   = /\b(\d{1,2}\.?\d{0,2})\s*(?:cgpa|gpa|%|percent|out of 10|\/10)\b/i;
const RE_DEGREE  = /\b(b\.?e\.?|b\.?tech\.?|b\.?sc\.?|b\.?com\.?|b\.?a\.?|m\.?tech\.?|m\.?sc\.?|m\.?e\.?|mba|phd|ph\.?d|bachelor|bachelors|master|masters|diploma|intermediate|higher secondary|secondary|ssc|hsc|10th|12th|graduate|postgraduate|post graduate)\b/i;

function isBullet(line) {
  return /^[\s]*[-•▪■*►▶→◆◇●★]\s+/.test(line) || /^[\s]*\d+[.)]\s+/.test(line);
}

function stripBullet(line) {
  return line
    .replace(/^[\s]*[-•▪■*►▶→◆◇●★]\s+/, '')
    .replace(/^[\s]*\d+[.)]\s+/, '')
    .trim();
}

function looksLikeTitle(line) {
  const t = line.trim();
  if (t.length < 2 || t.length > 90) return false;
  if (isBullet(t)) return false;
  if (/[.!?]$/.test(t) && t.length > 30) return false;  // long sentences end in punctuation
  const words = t.split(/\s+/);
  return words.length >= 1 && words.length <= 12;
}

/**
 * Stricter predicate used ONLY for project title detection.
 *
 * A valid project title must:
 *   - Have at least 2 words  (single words like "usage.", "API", "features." are fragments)
 *   - OR be a single word that is clearly a proper noun (all-caps abbreviation, capitalised >= 5 chars)
 *   - NOT end with sentence-terminator punctuation  (., !, ?)
 *   - NOT start with a lowercase letter (wrapped sentence continuation)
 *   - NOT start with a preposition/conjunction/continuation word (and, or, with, to, for, etc.)
 *   - NOT be a common stop/filler word
 *   - NOT be a generic descriptor word ("description", "features", "details", etc.)
 *   - Word count must be 2–10 (not a sprawling sentence)
 */
const PROJECT_TITLE_STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','for','with','to','of','from',
  'is','are','was','were','be','been','being','have','has','had',
  'description','overview','details','features','usage','summary','note','notes',
  'info','information','about','introduction','background','output','result','results',
  'approach','methodology','implementation','architecture','design','conclusion',
]);

function looksLikeProjectTitle(line) {
  const t = line.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (isBullet(t)) return false;

  // Sentence fragments: ends with period, exclamation, question mark
  if (/[.!?]$/.test(t)) return false;

  // Reject lines that start with a lowercase letter (continuation of previous line)
  if (/^[a-z]/.test(t)) return false;

  // Reject lines starting with continuation words / prepositions / conjunctions
  if (/^(?:and|or|with|to|for|in|on|at|of|by|from|including|enabling|ensuring|using|supporting|allowing|enhancing)\b/i.test(t)) return false;

  // Must not contain a comma mid-sentence (indicates a sentence, not a title)
  // Allow commas only if they appear after ≥3 words (e.g. "Search, Sort & Filter App")
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 10) return false;

  // Reject if every word is a stop word
  const meaningfulWords = words.filter(w => !PROJECT_TITLE_STOP_WORDS.has(w.toLowerCase()));
  if (meaningfulWords.length === 0) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4A — CONTACT FIELD EXTRACTION (from header block)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Known geographical cities, states, countries for strict location matching.
 * Location is ONLY extracted from the header block (top contact lines).
 */
const GEO_LOCATIONS = [
  // Major cities
  'San Francisco','Los Angeles','New York','Chicago','Boston','Austin','Seattle',
  'Houston','Dallas','Denver','Atlanta','Phoenix','Miami','Portland',
  'London','Berlin','Paris','Amsterdam','Madrid','Rome','Toronto','Vancouver',
  'Sydney','Melbourne','Singapore','Tokyo','Seoul','Beijing','Shanghai',
  'Mumbai','Delhi','New Delhi','Bengaluru','Bangalore','Hyderabad','Chennai',
  'Pune','Kolkata','Noida','Gurugram','Gurgaon','Ahmedabad','Jaipur','Indore',
  'Coimbatore','Tiruchirappalli','Madurai','Salem','Kochi','Trivandrum',
  // States / Regions
  'California','Texas','Washington','New York','Massachusetts','Illinois',
  'Florida','Georgia','North Carolina','Pennsylvania','Ohio','Michigan','Karnataka',
  'Tamil Nadu','Maharashtra','Telangana','Kerala','Andhra Pradesh','Gujarat',
  // Countries
  'USA','United States','UK','United Kingdom','India','Canada','Germany','France',
  'Australia','Japan','Singapore','Netherlands','Spain','Italy','New Zealand',
  // State abbreviations (only matched inside header lines, paired with city)
  'CA','NY','TX','WA','MA','IL','FL','PA','GA','NC','OH','MI','TN',
];

/** Terms that disqualify a string from being a location */
const NOT_LOCATION = [
  'university','college','institute','school','iit','nit','ucla','stanford','berkeley',
  'inc','corp','corporation','technologies','solutions','systems','labs','ltd','limited',
  'services','analytics','dashboard','platform','application','project','monitor',
  'developer','engineer','architect','manager','analyst','designer','senior','junior',
];

function isValidLocation(candidate) {
  if (!candidate || candidate.length < 2 || candidate.length > 50) return false;
  const lower = candidate.toLowerCase();
  return !NOT_LOCATION.some(kw => lower.includes(kw));
}

function extractLocation(headerLines) {
  const headerText = headerLines.join('\n');

  // 1. Labelled location: "Location: City, State"
  const labeled = headerText.match(/(?:location|address|city|residing in)[:\s]+([a-zA-Z\s,]{3,40})/i);
  if (labeled) {
    const c = labeled[1].trim().replace(/,$/, '');
    if (isValidLocation(c)) return c;
  }

  // 2. Scan each header line for a known geographic name (matched in isolation)
  for (const line of headerLines) {
    // Try known GEO_LOCATIONS
    for (const geo of GEO_LOCATIONS) {
      if (geo.length < 3) continue;  // skip bare 2-letter codes in isolation
      const re = new RegExp(`(?:^|[\\s|,•])${geo}(?:[,\\s]|$)`, 'i');
      if (re.test(line)) {
        // Attempt to capture "City, ST" or "City, Country" pair
        const pairRe = new RegExp(`\\b(${geo})[,\\s]+([A-Z]{2}|[A-Z][a-z]+)\\b`, 'i');
        const pair = line.match(pairRe);
        if (pair) {
          const candidate = `${pair[1]}, ${pair[2]}`;
          if (isValidLocation(candidate)) return candidate;
        }
        if (isValidLocation(geo)) return geo;
      }
    }

    // 3. Generic "Word, AB" or "Word, Word" pattern (only in header lines)
    const pairMatch = line.match(/\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)*),\s*([A-Z]{2}|[A-Z][a-zA-Z]{2,15})\b/);
    if (pairMatch) {
      const p1 = pairMatch[1];
      const p2 = pairMatch[2];
      const combined = `${p1}, ${p2}`;
      // Must not be a skill or disqualified word
      const p1Low = p1.toLowerCase();
      const isSkill = ALL_SKILLS.some(s => s.toLowerCase() === p1Low);
      if (!isSkill && isValidLocation(combined)) {
        return combined;
      }
    }
  }

  return null;  // strict: return null when no location found
}

function extractPhone(headerLines) {
  const text = headerLines.join('\n');

  // Strip out emails, URLs, and date ranges before searching for phone numbers
  // This prevents digits in email addresses (e.g. mukesh2004777@gmail.com)
  // or URL handles from being falsely extracted as a phone number.
  const sanitizedText = text
    .replace(RE_EMAIL, ' ')
    .replace(RE_LINKEDIN, ' ')
    .replace(RE_GITHUB, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/\b(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current|now)\b/gi, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ');

  // 1. Check for explicitly labelled phone number
  const labeledMatch = sanitizedText.match(/(?:phone|tel|mobile|cell|mob|contact|ph|call)[:\s#]+([+]?[\d\s().-]{7,25})/i);
  if (labeledMatch) {
    const raw = labeledMatch[1].trim().replace(/^[,;|•·\s]+|[,;|•·\s]+$/g, '');
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      if (digits.length >= 10 || /[\s().\-]/.test(raw) || raw.startsWith('+')) {
        return raw;
      }
    }
  }

  // 2. Strict phone regexes requiring proper boundaries (without consuming parentheses)
  const RE_PHONE_INTL = /(?:^|[\s,;|•·])(\+\d{1,4}[\s.\-]?(?:\(\d{1,5}\)|\d{1,5})[\s.\-]?\d{2,5}[\s.\-]?\d{2,5}(?:[\s.\-]?\d{1,5})?)(?=[\s,;|•·]|$)/;
  const RE_PHONE_PARENS = /(?:^|[\s,;|•·])(\(\d{2,5}\)[\s.\-]?\d{3,5}[\s.\-]?\d{3,5})(?=[\s,;|•·]|$)/;
  const RE_PHONE_FORMATTED = /(?:^|[\s,;|•·])(\d{2,5}[\s.\-]\d{3,5}(?:[\s.\-]\d{3,5})?)(?=[\s,;|•·]|$)/;
  const RE_PHONE_STANDALONE = /(?:^|[\s,;|•·])([6-9]\d{9}|\d{10,12})(?=[\s,;|•·]|$)/;

  const match = sanitizedText.match(RE_PHONE_INTL) ||
                sanitizedText.match(RE_PHONE_PARENS) ||
                sanitizedText.match(RE_PHONE_FORMATTED) ||
                sanitizedText.match(RE_PHONE_STANDALONE);

  if (match) {
    const raw = (match[1] || match[0]).trim().replace(/^[,;|•·\s]+|[,;|•·\s]+$/g, '');
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      if (digits.length >= 10 || /[\s().\-]/.test(raw) || raw.startsWith('+')) {
        return raw;
      }
    }
  }

  return '';
}

function extractContact(headerLines) {
  const text = headerLines.join('\n');

  const emailMatch = text.match(RE_EMAIL);
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  const phone = extractPhone(headerLines);

  const liMatch = text.match(RE_LINKEDIN);
  const linkedin = liMatch
    ? (liMatch[0].startsWith('http') ? liMatch[0].replace(/\/$/, '') : `https://${liMatch[0].replace(/\/$/, '')}`)
    : '';

  const ghMatch = text.match(RE_GITHUB);
  const github = ghMatch
    ? (ghMatch[0].startsWith('http') ? ghMatch[0].replace(/\/$/, '') : `https://${ghMatch[0].replace(/\/$/, '')}`)
    : '';

  const location = extractLocation(headerLines);

  return { email, phone, linkedin, github, location };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4B — FULL NAME EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

const NAME_NOISE = [
  'resume','curriculum','vitae','cv','page','contact','address','email','phone',
  'software','developer','engineer','designer','architect','manager','analyst',
  'lead','senior','junior','intern','consultant','full stack','frontend','backend',
];

function extractFullName(headerLines, doc, email) {
  // Stage 1: scan first 6 header lines for a 2–4 word capitalised phrase
  for (let i = 0; i < Math.min(6, headerLines.length); i++) {
    const line = headerLines[i].trim();
    if (!line) continue;

    // Skip lines that clearly contain contact data
    if (RE_EMAIL.test(line)) continue;
    if (RE_PHONE.test(line)) continue;
    if (/https?:\/\/|linkedin|github|@/i.test(line)) continue;
    if (/^\+?\d/.test(line)) continue;
    if (detectSection(line)) continue;

    const hasNoise = NAME_NOISE.some(n => new RegExp(`\\b${n}\\b`, 'i').test(line));
    if (hasNoise) continue;

    // Strip non-name characters
    const cleaned = line.replace(/[^a-zA-Z\s.'-]/g, '').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);

    if (words.length >= 2 && words.length <= 5 && cleaned.length >= 3 && cleaned.length <= 50) {
      // Must start with capital
      if (/^[A-Z]/.test(cleaned)) return cleaned;
    }
  }

  // Stage 2: Compromise NLP people extraction
  try {
    const people = doc.people().out('array');
    for (const p of people) {
      if (p.length < 3 || p.length > 45) continue;
      if (NAME_NOISE.some(n => new RegExp(`\\b${n}\\b`, 'i').test(p))) continue;
      if (p.split(/\s+/).length >= 2) return p;
    }
  } catch (_) {}

  // Stage 3: derive from email username
  if (email) {
    const user = email.split('@')[0];
    const parts = user.replace(/[\d._\-]/g, ' ').trim().split(/\s+/).filter(p => p.length >= 2);
    if (parts.length >= 2) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }

  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4C — SKILLS EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractSkills(fullText, skillSectionLines, softSectionLines) {
  const techSet = new Set();
  const softSet = new Set();

  // Match against master dictionaries using word boundaries
  for (const skill of TECH_SKILLS) {
    // For single-letter skills ('C', 'R'), only match if in explicit skill section or programming context
    if (skill.length === 1) {
      const isSingleLetterValid =
        skillSectionLines.some(line => new RegExp(`(?:^|[,|/•·\\s])${skill}(?:[,|/•·\\s]|$)`).test(line)) ||
        new RegExp(`\\b${skill}\\s*(?:programming|language|lang|developer)\\b`, 'i').test(fullText) ||
        new RegExp(`(?:programming|language|languages|skills)\\s*[:\\-]?.*\\b${skill}\\b`, 'i').test(fullText);
      if (isSingleLetterValid) {
        techSet.add(canonicalSkill(skill));
      }
      continue;
    }

    const esc = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(fullText)) {
      techSet.add(canonicalSkill(skill));
    }
  }
  for (const skill of SOFT_SKILLS) {
    const esc = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(fullText)) {
      softSet.add(canonicalSkill(skill));
    }
  }

  // Also parse skills section explicitly for anything listed there
  const skillLines = [...skillSectionLines, ...softSectionLines];
  for (const line of skillLines) {
    const tokens = line.split(/[,|/•·\t]+/).map(t => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const clean = stripBullet(token);
      if (clean.length < 2 || clean.length > 40) continue;
      if (/^(and|or|the|in|of|for|with|to|a|an|is|are|at|by)$/i.test(clean)) continue;

      const canon = canonicalSkill(clean);
      if (SOFT_SKILLS.some(s => s.toLowerCase() === clean.toLowerCase())) {
        softSet.add(canon);
      } else {
        techSet.add(canon);
      }
    }
  }

  const technicalSkills = [...techSet];
  const softSkills = [...softSet];

  // Combined deduplicated skills array
  const seenKeys = new Set();
  const skills = [];
  for (const s of [...technicalSkills, ...softSkills]) {
    const key = s.toLowerCase().replace(/\s+/g, '');
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      skills.push(s);
    }
  }

  return { technicalSkills, softSkills, skills };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4D — EXPERIENCE BLOCK EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractExperience(lines) {
  if (!lines || lines.length === 0) return [];

  const blocks = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    // An experience entry MUST have at least a role or company — never fake data
    const hasEvidence = (current.company && current.company.length > 1) ||
                        (current.role && current.role.length > 1);
    if (hasEvidence) {
      current.bulletPoints = [...new Set(current.bulletPoints.filter(b => b.length > 5))];
      blocks.push({ ...current });
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateRange = trimmed.match(RE_DATE_RANGE);
    const bullet = isBullet(trimmed);

    if (dateRange && !bullet) {
      // Line contains a date range — could be "Role | Company | Date" or just a date
      const withoutDate = trimmed.replace(RE_DATE_RANGE, '').trim();
      const period = dateRange[0].trim();

      if (current && !current.period) {
        // attach date to existing block
        current.period = period;
        if (withoutDate.length > 2 && !current.role) {
          const parts = withoutDate.split(/\s*[|–—]\s*/);
          current.role = (parts[0] || '').trim();
          current.company = (parts[1] || '').trim();
        }
      } else {
        flush();
        current = { company: '', role: '', period, bulletPoints: [] };
        if (withoutDate.length > 2) {
          const parts = withoutDate.split(/\s*[|–—]\s*/);
          current.role = (parts[0] || '').replace(/,$/, '').trim();
          current.company = (parts[1] || '').replace(/,$/, '').trim();
        }
      }
      continue;
    }

    if (bullet) {
      if (!current) current = { company: '', role: '', period: '', bulletPoints: [] };
      const b = stripBullet(trimmed);
      if (b.length > 5) current.bulletPoints.push(b);
      continue;
    }

    if (looksLikeTitle(trimmed)) {
      if (current && current.role) flush();   // flush previous block when we see a new title

      if (!current) current = { company: '', role: '', period: '', bulletPoints: [] };

      // Parse "Role at Company" / "Role | Company" / "Company, Role"
      const atMatch  = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
      const pipeMatch= trimmed.match(/^(.+?)\s*[|–—]\s*(.+)$/);

      if (atMatch) {
        current.role    = current.role    || atMatch[1].trim();
        current.company = current.company || atMatch[2].trim();
      } else if (pipeMatch) {
        if (!current.role)    current.role    = pipeMatch[1].trim();
        else if (!current.company) current.company = pipeMatch[2].trim();
      } else {
        if (!current.role)    current.role    = trimmed;
        else if (!current.company) current.company = trimmed;
      }
      continue;
    }

    // Long descriptive line — attach to current block as a bullet
    if (trimmed.length > 20 && current) {
      current.bulletPoints.push(trimmed);
    }
  }

  flush();
  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4E — PROJECT BLOCK EXTRACTION (EXTRACTS ALL PROJECTS)
// ─────────────────────────────────────────────────────────────────────────────

function extractTechsFromLine(text) {
  const found = new Set();
  for (const skill of TECH_SKILLS) {
    const esc = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(text)) {
      found.add(canonicalSkill(skill));
    }
  }
  return [...found];
}

function extractProjects(lines) {
  if (!lines || lines.length === 0) return [];

  const blocks = [];
  let current = null;

  /**
   * flush() saves the current block only when it has a valid project title.
   * If there is no title, any accumulated content is merged into the
   * PREVIOUS block rather than creating a phantom new project.
   */
  const flush = () => {
    if (!current) return;
    current.bulletPoints = [...new Set(current.bulletPoints.filter(b => b.length > 5))];
    current.technologies  = [...new Set(current.technologies)];

    if (current.title && current.title.length > 1) {
      blocks.push({ ...current });
    } else if (blocks.length > 0) {
      // Fragment with no title — merge into the last saved project
      const prev = blocks[blocks.length - 1];
      if (current.description) prev.bulletPoints.push(current.description);
      prev.bulletPoints.push(...current.bulletPoints);
      current.technologies.forEach(t => {
        if (!prev.technologies.includes(t)) prev.technologies.push(t);
      });
    }
    // else: orphan fragment with nothing useful — discard silently
    current = null;
  };

  const newBlock = () => ({
    title: '',
    description: '',
    technologies: [],
    bulletPoints: [],
    duration: '',
  });

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const dateRange = trimmed.match(RE_DATE_RANGE);
    const bullet    = isBullet(trimmed);

    // ── Date range line ─────────────────────────────────────────────────────
    // Pattern: "Project Title | Tech, Stack | Jan 2023 – Mar 2023"
    // OR just a standalone date when the title came on the previous line.
    if (dateRange && !bullet) {
      const beforeDate = trimmed.replace(RE_DATE_RANGE, '').replace(/[|,]?\s*$/, '').trim();
      const period     = dateRange[0].trim();

      if (beforeDate.length > 2) {
        // Title + date on same line → always a new project
        flush();
        current = newBlock();
        current.duration = period;
        const parts = beforeDate.split(/\s*\|\s*/);
        current.title = parts[0].trim();
        for (let p = 1; p < parts.length; p++) {
          extractTechsFromLine(parts[p]).forEach(t => {
            if (!current.technologies.includes(t)) current.technologies.push(t);
          });
        }
        extractTechsFromLine(trimmed).forEach(t => {
          if (!current.technologies.includes(t)) current.technologies.push(t);
        });
      } else if (current) {
        // Date-only line → attach to the block we're already building
        current.duration = period;
      }
      continue;
    }

    // ── Bullet point ────────────────────────────────────────────────────────
    if (bullet) {
      if (!current) current = newBlock();
      const b = stripBullet(trimmed);
      if (b.length > 5) {
        current.bulletPoints.push(b);
        extractTechsFromLine(b).forEach(t => {
          if (!current.technologies.includes(t)) current.technologies.push(t);
        });
      }
      continue;
    }

    // ── Explicit tech-stack label line ──────────────────────────────────────
    if (/^(?:tech(?:nolog(?:ies|y))?|stack|tools?|built\s+with|languages?|used)[:\s]/i.test(trimmed)) {
      if (!current) current = newBlock();
      extractTechsFromLine(trimmed).forEach(t => {
        if (!current.technologies.includes(t)) current.technologies.push(t);
      });
      continue;
    }

    // ── Project title line ───────────────────────────────────────────────────
    // Use the STRICT looksLikeProjectTitle predicate here — NOT looksLikeTitle.
    // This prevents sentence fragments from triggering phantom projects.
    if (looksLikeProjectTitle(trimmed)) {
      // Only flush and start a new project if the current block already has a
      // confirmed title (prevents treating a description line as a 2nd project).
      if (current && current.title) {
        flush();
      }
      if (!current) current = newBlock();

      // Pipe separates title from inline tech list: "Proj Name | React, Node.js"
      const pipeIdx = trimmed.indexOf('|');
      if (pipeIdx > -1) {
        current.title = trimmed.slice(0, pipeIdx).trim();
        extractTechsFromLine(trimmed.slice(pipeIdx + 1)).forEach(t => {
          if (!current.technologies.includes(t)) current.technologies.push(t);
        });
      } else {
        current.title = trimmed;
      }
      extractTechsFromLine(trimmed).forEach(t => {
        if (!current.technologies.includes(t)) current.technologies.push(t);
      });
      continue;
    }

    // ── Descriptive / continuation text ─────────────────────────────────────
    // Short lines that are NOT valid titles and NOT bullets → attach to current
    // block as extra description; never spawn a new project.
    if (trimmed.length > 0) {
      if (!current) current = newBlock();
      if (trimmed.length > 20) {
        if (!current.description) {
          current.description = trimmed;
        } else {
          current.bulletPoints.push(trimmed);
        }
        extractTechsFromLine(trimmed).forEach(t => {
          if (!current.technologies.includes(t)) current.technologies.push(t);
        });
      } else {
        // Very short non-title line (e.g. "usage." or "v2.0") →
        // attach to description/bullets if a project is open, never start new project
        if (current.title) {
          current.bulletPoints.push(trimmed);
        }
      }
    }
  }

  flush();
  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4F — EDUCATION BLOCK EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractEducation(lines) {
  if (!lines || lines.length === 0) return [];

  const blocks = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    if (current.degree || current.institution) blocks.push({ ...current });
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const hasDegree = RE_DEGREE.test(trimmed);
    const years = [...trimmed.matchAll(RE_YEAR)].map(m => m[0]);
    const gradeMatch = trimmed.match(RE_GRADE);
    const bullet = isBullet(trimmed);

    // Filter out grade/result/percentage lines from becoming institutions
    const isResultOrGrade = /^(?:result|percentage|marks|grade|cgpa|gpa|status|division)[:\s]/i.test(trimmed) || /^(?:pass|failed?|first class|distinction)\b/i.test(trimmed);
    if (isResultOrGrade) {
      if (current && !current.grade) current.grade = trimmed;
      continue;
    }

    if (hasDegree) {
      flush();
      current = {
        degree: trimmed.replace(RE_GRADE, '').replace(RE_YEAR, '').replace(/[\s,|–—\-]+$/, '').trim(),
        institution: '',
        year: years.length ? years[years.length - 1] : '',
        grade: gradeMatch ? gradeMatch[0].trim() : '',
      };
      continue;
    }

    if (!current) current = { degree: '', institution: '', year: '', grade: '' };

    if (years.length && !current.year) current.year = years[years.length - 1];
    if (gradeMatch && !current.grade) current.grade = gradeMatch[0].trim();

    if (!bullet && trimmed.length > 2 && trimmed.length < 120) {
      if (!current.degree) {
        current.degree = trimmed;
      } else if (!current.institution) {
        // Strip year/grade noise from institution name
        current.institution = trimmed.replace(RE_YEAR, '').replace(RE_GRADE, '').replace(/[\s,|–—\-]+$/, '').trim();
      }
    }
  }

  flush();
  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4G — CERTIFICATIONS EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractCertifications(lines) {
  const seen = new Set();
  const result = [];
  for (const line of lines) {
    const c = stripBullet(line.trim());
    if (c.length < 3) continue;
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4H — LANGUAGES EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_LANGS = [
  'English','Spanish','French','German','Hindi','Tamil','Telugu','Malayalam',
  'Kannada','Marathi','Gujarati','Bengali','Punjabi','Mandarin','Chinese',
  'Japanese','Korean','Arabic','Portuguese','Italian','Russian','Dutch',
  'Swedish','Turkish','Polish','Vietnamese','Thai','Urdu',
];

function extractLanguages(langLines, fallbackText) {
  const found = new Set();

  const scanText = (text) => {
    for (const lang of KNOWN_LANGS) {
      if (new RegExp(`\\b${lang}\\b`, 'i').test(text)) found.add(lang);
    }
  };

  if (langLines.length > 0) {
    for (const line of langLines) {
      scanText(line);
      // Also split on commas/bullets for explicitly listed languages
      for (const token of line.split(/[,|•·\t]+/)) {
        const clean = stripBullet(token.trim());
        if (clean.length >= 3 && clean.length <= 25) {
          for (const lang of KNOWN_LANGS) {
            if (lang.toLowerCase() === clean.toLowerCase()) found.add(lang);
          }
        }
      }
    }
  } else {
    // Only fallback-scan if no explicit language section found
    scanText(fallbackText);
  }

  return [...found];
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4I — SUMMARY EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractSummary(summaryLines, allLines) {
  if (Array.isArray(summaryLines) && summaryLines.length > 0) {
    const text = summaryLines.join(' ').replace(/\s+/g, ' ').trim();
    if (text.length > 10) return text;
  }

  // Heuristic fallback: collect introductory descriptive sentences/paragraphs near the top
  const candidates = [];

  for (let i = 0; i < Math.min(25, allLines.length); i++) {
    const line = allLines[i].trim();
    if (!line) continue;

    // If we reached a major structural non-summary section (skills, experience, education, projects), stop scanning
    const sec = detectSection(line);
    if (sec && sec !== 'summary') {
      break;
    }
    if (sec === 'summary') {
      continue;
    }

    // Skip contact info, emails, phones, URLs, links
    if (RE_EMAIL.test(line) || RE_PHONE.test(line)) continue;
    if (/https?:\/\/|linkedin\.com|github\.com|portfolio|behance|dribbble|@/i.test(line)) continue;
    if (line.length < 25) continue;

    // Skip if line looks like a raw list of skills (e.g. "React, Node.js, Python, Java, Docker")
    if (line.split(',').length >= 4 && !line.includes('.')) continue;
    // Skip if line looks like degree or education
    if (RE_DEGREE.test(line) && line.length < 50) continue;

    candidates.push(line);
    if (candidates.length >= 6) break;
  }

  if (candidates.length > 0) {
    return candidates.join(' ').replace(/\s+/g, ' ').trim();
  }

  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — VALIDATE OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

function validateOutput(result, projectTitles) {
  // 1. location must not be a project title or institution
  if (result.location) {
    const locLow = result.location.toLowerCase();
    const badLoc =
      NOT_LOCATION.some(kw => locLow.includes(kw)) ||
      projectTitles.some(t => t.toLowerCase() === locLow);
    if (badLoc) result.location = null;
  }

  // 2. fullName must not be a project title
  if (result.fullName) {
    const nameLow = result.fullName.toLowerCase();
    if (projectTitles.some(t => t.toLowerCase() === nameLow)) {
      result.fullName = '';
    }
  }

  // 3. experience must not duplicate projects
  result.experience = result.experience.filter(exp => {
    const roleLow = (exp.role || '').toLowerCase();
    const compLow = (exp.company || '').toLowerCase();
    return !projectTitles.some(t => {
      const tl = t.toLowerCase();
      return tl === roleLow || tl === compLow;
    });
  });

  // 4. Deduplicate skill arrays
  result.technicalSkills = [...new Set(result.technicalSkills)];
  result.softSkills      = [...new Set(result.softSkills)];
  result.skills          = [...new Set(result.skills)];
  result.certifications  = [...new Set(result.certifications)];
  result.languages       = [...new Set(result.languages)];

  // 5. Validate email format
  if (result.email && !RE_EMAIL.test(result.email)) result.email = '';

  // 6. Validate phone (valid digit count and structure)
  if (result.phone) {
    const digits = result.phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15 || (digits.length < 10 && !/[\s().\-]/.test(result.phone) && !result.phone.startsWith('+'))) {
      result.phone = '';
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT: parseCandidateDetails
// ─────────────────────────────────────────────────────────────────────────────

export const parseCandidateDetails = (rawText) => {
  const t0 = Date.now();

  /** Empty result template — always returned on failure */
  const EMPTY = () => ({
    fullName: '',
    email: '',
    phone: '',
    location: null,
    linkedin: '',
    github: '',
    summary: '',
    technicalSkills: [],
    softSkills: [],
    skills: [],
    languages: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
  });

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 10) {
    return EMPTY();
  }

  try {
    // ── Step 1: Clean ────────────────────────────────────────────────────────
    const cleaned = cleanText(rawText);
    const allLines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

    // ── Step 2: Segment ──────────────────────────────────────────────────────
    const sections = segmentSections(cleaned);

    // ── Step 3: NLP doc (for name extraction only) ────────────────────────────
    const doc = nlp(cleaned.slice(0, 2000)); // only top portion for speed

    // ── Step 4: Extract fields ───────────────────────────────────────────────
    const contact  = extractContact(sections.header);
    const fullName = extractFullName(sections.header, doc, contact.email);
    const summary  = extractSummary(sections.summary, allLines);

    const { technicalSkills, softSkills, skills } = extractSkills(
      cleaned,
      sections.skills,
      sections.softSkills,
    );

    const experience     = extractExperience(sections.experience);
    const projects       = extractProjects(sections.projects);
    const education      = extractEducation(sections.education);
    const certifications = extractCertifications(sections.certifications);
    const achievements   = extractCertifications(sections.achievements);  // same logic
    const languages      = extractLanguages(sections.languages, cleaned);

    const projectTitles  = projects.map(p => p.title).filter(Boolean);

    // ── Step 5: Assemble result ───────────────────────────────────────────────
    const result = {
      fullName,
      email:     contact.email,
      phone:     contact.phone,
      location:  contact.location,
      linkedin:  contact.linkedin,
      github:    contact.github,
      summary,
      technicalSkills,
      softSkills,
      skills,
      languages,
      education,
      experience,
      projects,
      certifications,
      achievements,
    };

    // ── Step 6: Validate ─────────────────────────────────────────────────────
    validateOutput(result, projectTitles);

    const ms = Date.now() - t0;
    console.log(
      `🔍 [Parser] "${result.fullName || 'Unknown'}" | ` +
      `Exp:${result.experience.length} Proj:${result.projects.length} ` +
      `Edu:${result.education.length} Skills:${result.skills.length} | ${ms}ms`,
    );

    return result;
  } catch (err) {
    console.error('💥 [Parser] parseCandidateDetails threw:', err.message);
    return EMPTY();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RAW TEXT EXTRACTOR — PDF & DOCX
// ─────────────────────────────────────────────────────────────────────────────

export const extractRawText = async (filePath, mimeType, originalName = '') => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Resume file not found: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Uploaded file is empty (0 bytes).');
  }

  const ext = path.extname(originalName || filePath).toLowerCase();

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (mimeType.includes('pdf') || ext === '.pdf') {
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

      if (!text || text.length < 5) {
        throw new Error('PDF has no readable text (may be image-based; OCR required).');
      }
      return text;
    } catch (err) {
      if (err.message.includes('no readable text') || err.message.includes('OCR')) throw err;
      throw new Error(`PDF extraction error: ${err.message}`);
    }
  }

  // ── DOCX ────────────────────────────────────────────────────────────────────
  if (mimeType.includes('openxmlformats') || mimeType.includes('wordprocessingml') || ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value?.trim() ?? '';
      if (!text || text.length < 5) {
        throw new Error('DOCX has no readable text.');
      }
      return text;
    } catch (err) {
      if (err.message.includes('no readable text')) throw err;
      throw new Error(`DOCX extraction error: ${err.message}`);
    }
  }

  // ── DOC (legacy) ─────────────────────────────────────────────────────────────
  if (mimeType.includes('msword') || ext === '.doc') {
    throw new Error('Legacy .doc format is not supported. Please convert to PDF or DOCX.');
  }

  throw new Error(`Unsupported format "${mimeType}". Only PDF and DOCX are accepted.`);
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE ORCHESTRATOR — parseAndSaveResume
// ─────────────────────────────────────────────────────────────────────────────

export const parseAndSaveResume = async (resumeId, forceReparse = false) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new ApiError(404, 'Resume record not found.');

  // Return cached result if already parsed (unless forced)
  if (
    !forceReparse &&
    resume.parseStatus === 'parsed' &&
    resume.parsedData?.fullName &&
    typeof resume.parsedData?.summary === 'string'
  ) {
    console.log(`ℹ️ [Parser] Resume ${resumeId} already parsed — using cache.`);
    return resume;
  }

  resume.parseStatus = 'parsing';
  resume.parseError  = '';
  await resume.save();

  try {
    let rawText = resume.parsedText;

    if (!rawText || forceReparse) {
      const filePath = path.isAbsolute(resume.uploadPath)
        ? resume.uploadPath
        : path.join(process.cwd(), resume.uploadPath);

      if (fs.existsSync(filePath)) {
        console.log(`⚙️ [Parser] Extracting text — ${filePath} (${resume.fileType})`);
        rawText = await extractRawText(filePath, resume.fileType, resume.originalName);
      } else if (!rawText) {
        throw new Error(`Resume file not found: ${filePath}`);
      } else {
        console.log(`ℹ️ [Parser] Physical file not found at ${filePath}, using stored parsedText.`);
      }
    }

    console.log(`⚙️ [Parser] Analysing ${rawText.length} chars…`);
    const parsedData = parseCandidateDetails(rawText);

    resume.parsedText  = rawText;
    resume.parsedData  = parsedData;
    resume.parsedAt    = new Date();
    resume.parseStatus = 'parsed';
    resume.parseError  = '';
    await resume.save();

    console.log(
      `✅ [Parser] Resume ${resume._id} — ` +
      `"${parsedData.fullName}" | Skills:${parsedData.skills?.length} ` +
      `Exp:${parsedData.experience?.length} Proj:${parsedData.projects?.length} ` +
      `Edu:${parsedData.education?.length}`,
    );

    return resume;
  } catch (error) {
    console.error(`💥 [Parser] Failed for ${resumeId}:`, error.message);
    resume.parseStatus = 'failed';
    resume.parseError  = error.message || 'Resume parsing failed.';
    await resume.save();
    throw new ApiError(400, `Resume parsing failed: ${error.message}`);
  }
};
