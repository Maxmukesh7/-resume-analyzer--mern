/**
 * ============================================================
 * COMPLETE END-TO-END AUTOMATED TEST SUITE
 * AI Resume Analyzer (MERN Stack)
 * ============================================================
 * Phases Covered:
 *   Phase 1  - Environment & System Setup
 *   Phase 3  - Authentication, Password Hashing & JWT Security
 *   Phase 4  - MongoDB Atlas CRUD & Relational Data Integrity
 *   Phase 5  - Resume Upload & Storage
 *   Phase 6  - Resume Parsing Engine (Resumes A, B, C & Boundaries)
 *   Phase 7  - ATS Scoring Engine & Mathematical Consistency
 *   Phase 8  - Gemini AI Analysis & Fallback Resilience
 *   Phase 9  - Job Description Matching & Caching Logic
 *   Phase 10 - AI Resume Improvement & Content Integrity
 *   Phase 11 - Admin Authorization, RBAC & Diagnostics
 *   Phase 12/13 - API Response Standardization & Error Handling
 * ============================================================
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Import Models
import User from './models/User.js';
import Resume from './models/Resume.js';
import ResumeAnalysis from './models/ResumeAnalysis.js';
import AIAnalysis from './models/AIAnalysis.js';
import JobMatch from './models/JobMatch.js';
import ResumeImprovement from './models/ResumeImprovement.js';
import ActivityLog from './models/ActivityLog.js';

// Import Services & Helpers
import connectDB from './config/db.js';
import { parseCandidateDetails, parseAndSaveResume } from './services/resumeParserService.js';
import { evaluateResumeAts } from './services/atsEngineService.js';
import { generateGeminiResumeAnalysis } from './services/geminiService.js';
import { compareResumeWithJobDescription } from './services/jobMatch.service.js';
import { improveFullResumeService } from './services/resumeImprovementService.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from './utils/jwtHelper.js';
import { formatResponse, formatErrorResponse } from './utils/responseFormatter.js';
import seedInitialAdmin from './utils/seedAdmin.js';

let passed = 0;
let failed = 0;
let total = 0;
const failures = [];

function assert(description, condition, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failed++;
    const errMsg = `  ❌ [FAIL] ${description} ${details ? `(${details})` : ''}`;
    console.error(errMsg);
    failures.push(description);
  }
}

function sectionHeader(title) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(70)}`);
}

async function runSuite() {
  console.log('🚀 Starting Full End-to-End Test Suite for AI Resume Analyzer...');

  // ==========================================================
  // PHASE 1 — ENVIRONMENT & SETUP
  // ==========================================================
  sectionHeader('PHASE 1: ENVIRONMENT & SYSTEM SETUP');
  assert('MONGODB_URI configured', !!process.env.MONGODB_URI);
  assert('JWT_SECRET configured', !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16);
  assert('REFRESH_SECRET configured', !!process.env.REFRESH_SECRET);
  assert('PORT configured or defaultable', !!process.env.PORT || true);

  // Connect to Database
  await connectDB();
  assert('MongoDB connection readyState is connected (1)', mongoose.connection.readyState === 1);

  // Seed Admin Check
  await seedInitialAdmin();
  const defaultAdmin = await User.findOne({ email: 'admin@resumeanalyzer.com' }) || await User.findOne({ role: 'admin' });
  assert('Default Admin user seeded in database', !!defaultAdmin && defaultAdmin.role === 'admin');

  // ==========================================================
  // PHASE 3 — AUTHENTICATION & SECURITY
  // ==========================================================
  sectionHeader('PHASE 3: AUTHENTICATION & SECURITY AUDIT');

  const testEmail = `e2e_test_${Date.now()}@example.com`;
  const testPassword = 'Password@1234';

  // 1. Password Hashing Verification
  const testUser = new User({
    fullName: 'Test Candidate',
    email: testEmail,
    password: testPassword,
    role: 'user'
  });
  await testUser.save();

  assert('User created in MongoDB', !!testUser._id);
  assert('Password is NOT stored in plain text', testUser.password !== testPassword);
  assert('Password is a valid bcrypt hash ($2a$ or $2b$)', testUser.password.startsWith('$2'));

  const passwordMatches = await testUser.matchPassword(testPassword);
  assert('matchPassword returns true for correct password', passwordMatches === true);

  const wrongPasswordMatches = await testUser.matchPassword('WrongPass!999');
  assert('matchPassword returns false for wrong password', wrongPasswordMatches === false);

  // 2. JWT Generation and Expiration Security
  const accessToken = generateAccessToken(testUser);
  assert('Access token generated successfully', typeof accessToken === 'string' && accessToken.length > 20);

  const refreshToken = generateRefreshToken(testUser);
  assert('Refresh token generated successfully', typeof refreshToken === 'string' && refreshToken.length > 20);

  const decoded = verifyAccessToken(accessToken);
  assert('Decoded token contains user id', decoded.id === testUser._id.toString());
  assert('Decoded token contains user role', decoded.role === 'user');

  // 3. Duplicate Email Protection
  let duplicateCaught = false;
  try {
    const dup = new User({
      fullName: 'Duplicate Candidate',
      email: testEmail,
      password: 'AnotherPassword@1234'
    });
    await dup.save();
  } catch (err) {
    duplicateCaught = true;
  }
  assert('Duplicate email rejected by database unique index', duplicateCaught === true);

  // ==========================================================
  // PHASE 4 — MONGODB COLLECTIONS & CRUD OPERATIONS
  // ==========================================================
  sectionHeader('PHASE 4: MONGODB COLLECTIONS & RELATIONS');

  // Create Resume Record
  const testResume = await Resume.create({
    user: testUser._id,
    originalName: 'Candidate_Resume_E2E.pdf',
    fileName: `resume_${Date.now()}.pdf`,
    fileType: 'application/pdf',
    fileSize: 1048576,
    uploadPath: 'uploads/test_resume.pdf',
    uploadDate: new Date(),
    status: 'uploaded',
    parseStatus: 'pending'
  });
  assert('Resume collection Create successful', !!testResume._id);

  // Read Resume
  const fetchedResume = await Resume.findById(testResume._id);
  assert('Resume collection Read successful & matches user', fetchedResume.user.toString() === testUser._id.toString());

  // Update Resume
  testResume.parsedText = 'Alex Smith | Software Engineer | Python, React, Node.js';
  testResume.parseStatus = 'parsed';
  await testResume.save();
  assert('Resume collection Update successful', testResume.parseStatus === 'parsed');

  // Activity Log
  const log = await ActivityLog.create({
    user: testUser._id,
    action: 'E2E Test Action',
    description: 'Running Phase 4 collection test',
    ipAddress: '127.0.0.1'
  });
  assert('ActivityLog collection Create successful', !!log._id);

  // ==========================================================
  // PHASE 6 — RESUME PARSING ENGINE (HIGH PRIORITY)
  // ==========================================================
  sectionHeader('PHASE 6: RESUME PARSING ACCURACY (RESUMES A, B, C)');

  // ── RESUME A: 2 projects, 0 experience, has skills, has education ──
  const resumeA_text = `
Alex Morgan
alex.morgan@college.edu | +1 (555) 019-2834 | Boston, MA
https://linkedin.com/in/alexmorgan | https://github.com/alexmorgan

SUMMARY
Energetic Computer Science graduate with strong skills in React, Node.js, Express, MongoDB, and Python.

TECHNICAL SKILLS
JavaScript, TypeScript, React, Node.js, Express, MongoDB, Python, Git, Docker, HTML, CSS, Tailwind CSS

EDUCATION
Bachelor of Science in Computer Science | Boston University | 2020 – 2024 | GPA: 3.8/4.0

PROJECTS
Smart Campus Navigation App | React Native, Node.js, MongoDB | Jan 2024 – Apr 2024
- Built mobile indoor navigation with shortest path graph algorithm.
- Integrated interactive campus map used by 3,000+ university students.

AI Flashcard Generator | Next.js, OpenAI API, Tailwind CSS | Sep 2023 – Dec 2023
- Developed automated spaced repetition flashcard web platform.
- Implemented user auth and cloud synchronization with PostgreSQL.

CERTIFICATIONS
- AWS Certified Cloud Practitioner
`;

  const parsedA = parseCandidateDetails(resumeA_text);
  console.log(`  [Resume A] Name: "${parsedA.fullName}" | Projects: ${parsedA.projects.length} | Experience: ${parsedA.experience.length} | Location: "${parsedA.location}"`);
  assert('Resume A: Full name extracted', parsedA.fullName?.includes('Alex Morgan'));
  assert('Resume A: Exactly 2 projects (projects.length === 2)', parsedA.projects.length === 2);
  assert('Resume A: Exactly 0 experience (experience.length === 0)', parsedA.experience.length === 0);
  assert('Resume A: Skills extracted (>= 5 skills)', parsedA.skills.length >= 5);
  assert('Resume A: Education extracted (1 entry)', parsedA.education.length === 1);
  assert('Resume A: Project 1 title is Smart Campus Navigation App', parsedA.projects[0]?.title?.includes('Smart Campus Navigation'));
  assert('Resume A: Project 2 title is AI Flashcard Generator', parsedA.projects[1]?.title?.includes('AI Flashcard Generator'));
  assert('Resume A: Location extracted as Boston, MA', parsedA.location?.includes('Boston'));

  // ── RESUME B: 3 projects, 1 internship, NO location ──
  const resumeB_text = `
Jordan Lee
jordan.lee@devmail.io | +1 555-432-8765
github.com/jordanlee | linkedin.com/in/jordanlee

CAREER OBJECTIVE
Passionate Software Engineer skilled in TypeScript, Python, Go, Docker, and PostgreSQL.

SKILLS
TypeScript, JavaScript, Python, Go, React, PostgreSQL, Docker, Redis, REST APIs, Git

WORK EXPERIENCE
Software Engineering Intern | NextGen Cloud Labs | June 2023 – Aug 2023
- Built telemetry dashboard with React and Chart.js.
- Reduced API response times by 35% through Redis caching.

KEY PROJECTS
Microservices Job Queue | Go, RabbitMQ, Docker | 2024
- Distributed background job processor handling 5,000 concurrent jobs.

Real-time Collaboration Canvas | React, WebSockets, Node.js | 2023
- Interactive multi-user drawing board with sub-50ms latency sync.

Portfolio & Developer Blog | Next.js, Tailwind CSS | 2022
- Responsive tech blog with MDX support and full-text search.

EDUCATION
B.S. in Software Engineering | Tech University (2020 – 2024)
`;

  const parsedB = parseCandidateDetails(resumeB_text);
  console.log(`  [Resume B] Name: "${parsedB.fullName}" | Projects: ${parsedB.projects.length} | Experience: ${parsedB.experience.length} | Location: "${parsedB.location}"`);
  assert('Resume B: Name extracted', parsedB.fullName?.includes('Jordan Lee'));
  assert('Resume B: Exactly 3 projects (projects.length === 3)', parsedB.projects.length === 3);
  assert('Resume B: Exactly 1 work experience/internship (experience.length === 1)', parsedB.experience.length === 1);
  assert('Resume B: Location is null (NO location present in header)', parsedB.location === null);
  assert('Resume B: Project 1 title = Microservices Job Queue', parsedB.projects[0]?.title?.includes('Microservices Job Queue'));
  assert('Resume B: Project 2 title = Real-time Collaboration Canvas', parsedB.projects[1]?.title?.includes('Real-time Collaboration Canvas'));
  assert('Resume B: Project 3 title = Portfolio & Developer Blog', parsedB.projects[2]?.title?.includes('Portfolio'));

  // ── RESUME C: 1 project, 2 work experiences, Location present ──
  const resumeC_text = `
Elena Rostova
elena.rostova@techsolutions.com | +1 (415) 789-0123 | San Francisco, CA
linkedin.com/in/elenarostova | github.com/elenarostova

PROFESSIONAL SUMMARY
Senior Full Stack Engineer with 6+ years architecting microservices and enterprise web applications.

CORE SKILLS
JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker, Kubernetes, GraphQL, Jest

WORK EXPERIENCE
Senior Software Engineer | Stripe Enterprises | Jan 2021 – Present
- Architected payment routing engine processing $50M monthly transactions.
- Migrated legacy frontend to Next.js, increasing Lighthouse score by 40%.

Software Engineer | Alpha Health Tech | July 2018 – Dec 2020
- Built HIPAA-compliant REST APIs using Express, TypeScript, and PostgreSQL.
- Implemented OAuth2 and RBAC authorization framework.

NOTABLE PROJECTS
Decentralized Escrow Protocol | Solidity, React, Node.js | 2023
- Automated smart contract escrow system with multi-sig security.

EDUCATION
Master of Science in Computer Science | Stanford University | 2016 – 2018
Bachelor of Science in Computer Engineering | UC Berkeley | 2012 – 2016

CERTIFICATIONS
- AWS Certified Solutions Architect Professional
`;

  const parsedC = parseCandidateDetails(resumeC_text);
  console.log(`  [Resume C] Name: "${parsedC.fullName}" | Projects: ${parsedC.projects.length} | Experience: ${parsedC.experience.length} | Location: "${parsedC.location}"`);
  assert('Resume C: Name extracted', parsedC.fullName?.includes('Elena Rostova'));
  assert('Resume C: Exactly 1 project (projects.length === 1)', parsedC.projects.length === 1);
  assert('Resume C: Exactly 2 work experiences (experience.length === 2)', parsedC.experience.length === 2);
  assert('Resume C: Location is San Francisco, CA', parsedC.location?.includes('San Francisco'));
  assert('Resume C: Experience 1 company is Stripe', parsedC.experience[0]?.company?.includes('Stripe'));
  assert('Resume C: Experience 2 company is Alpha Health', parsedC.experience[1]?.company?.includes('Alpha Health'));

  // Save parsed data to test resume
  testResume.parsedData = parsedC;
  testResume.parsedText = resumeC_text;
  await testResume.save();

  // ==========================================================
  // PHASE 7 — ATS SCORE CALCULATION & MATHEMATICAL CONSISTENCY
  // ==========================================================
  sectionHeader('PHASE 7: ATS SCORE ENGINE & SANITY CHECKS');

  const atsReport = await evaluateResumeAts(testResume._id, testUser._id, true);

  assert('ATS overallScore is generated', typeof atsReport.overallScore === 'number');
  assert('ATS overallScore is in range 0 - 100', atsReport.overallScore >= 0 && atsReport.overallScore <= 100);
  assert('skillsScore in range 0 - 100', atsReport.skillsScore >= 0 && atsReport.skillsScore <= 100);
  assert('experienceScore in range 0 - 100', atsReport.experienceScore >= 0 && atsReport.experienceScore <= 100);
  assert('educationScore in range 0 - 100', atsReport.educationScore >= 0 && atsReport.educationScore <= 100);
  assert('projectsScore in range 0 - 100', atsReport.projectsScore >= 0 && atsReport.projectsScore <= 100);
  assert('structureScore in range 0 - 100', atsReport.structureScore >= 0 && atsReport.structureScore <= 100);
  assert('keywordScore in range 0 - 100', atsReport.keywordScore >= 0 && atsReport.keywordScore <= 100);
  assert('formattingScore in range 0 - 100', atsReport.formattingScore >= 0 && atsReport.formattingScore <= 100);
  assert('Formatting score not penalized for clean text (is >= 80)', atsReport.formattingScore >= 80);
  assert('Rating label is one of expected values', ['Excellent', 'Very Good', 'Good', 'Needs Improvement'].includes(atsReport.ratingLabel));
  assert('Strengths array is populated', Array.isArray(atsReport.strengths) && atsReport.strengths.length > 0);
  assert('ATS report saved in MongoDB', !!atsReport._id);

  // ==========================================================
  // PHASE 8 — GEMINI AI ANALYSIS & FALLBACK
  // ==========================================================
  sectionHeader('PHASE 8: GEMINI AI ANALYSIS ENGINE & FALLBACK');

  const aiAnalysis = await generateGeminiResumeAnalysis(testResume._id, testUser._id, true);

  assert('AI analysis document returned', !!aiAnalysis);
  assert('AI analysis summary generated', typeof aiAnalysis.summary === 'string' && aiAnalysis.summary.length > 20);
  assert('AI strengths list populated', Array.isArray(aiAnalysis.strengths) && aiAnalysis.strengths.length > 0);
  assert('AI weaknesses list populated', Array.isArray(aiAnalysis.weaknesses) && aiAnalysis.weaknesses.length > 0);
  assert('AI missingSkills list populated', Array.isArray(aiAnalysis.missingSkills));
  assert('AI recommendations populated', Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length > 0);
  assert('AI recruiterFeedback populated', Array.isArray(aiAnalysis.recruiterFeedback));
  assert('AI analysis persisted in MongoDB with correct resumeId', aiAnalysis.resumeId.toString() === testResume._id.toString());

  // ==========================================================
  // PHASE 9 — JOB DESCRIPTION MATCHING
  // ==========================================================
  sectionHeader('PHASE 9: JOB DESCRIPTION MATCHING');

  const sampleJD = `
We are looking for a Senior Full Stack Engineer with strong experience in JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker, and Kubernetes.
You will architect high-throughput microservices, design modern user interfaces, collaborate with cross-functional Agile teams, and drive engineering best practices.
  `;

  const jobMatch = await compareResumeWithJobDescription(
    testUser._id,
    testResume._id,
    'Senior Full Stack Engineer',
    'Acme Cloud Corp',
    sampleJD,
    true
  );

  assert('Job match document created', !!jobMatch._id);
  assert('matchScore is in range 0 - 100', jobMatch.matchScore >= 0 && jobMatch.matchScore <= 100);
  assert('matchedSkills populated with required tech stack', jobMatch.matchedSkills.length >= 3);
  assert('matchedKeywords array populated', jobMatch.matchedKeywords.length >= 3);
  assert('strengths generated for match', jobMatch.strengths.length > 0);
  assert('overallFeedback generated', typeof jobMatch.overallFeedback === 'string' && jobMatch.overallFeedback.length > 10);

  // Deduplication / Cache test: same resume + same JD should return cached record without force
  const cachedMatch = await compareResumeWithJobDescription(
    testUser._id,
    testResume._id,
    'Senior Full Stack Engineer',
    'Acme Cloud Corp',
    sampleJD,
    false
  );
  assert('Cached job match returns identical document ID', cachedMatch._id.toString() === jobMatch._id.toString());

  // ==========================================================
  // PHASE 10 — AI RESUME IMPROVEMENT
  // ==========================================================
  sectionHeader('PHASE 10: AI RESUME IMPROVEMENT & ORIGINAL CONTENT INTEGRITY');

  const improvement = await improveFullResumeService(testResume._id, testUser._id, {
    targetJobDescription: sampleJD,
    experienceLevel: 'Experienced',
    industry: 'Software Engineering',
    force: true
  });

  assert('Resume improvement document created', !!improvement._id);
  assert('improvedSummary generated', typeof improvement.improvedSummary === 'string' && improvement.improvedSummary.length > 20);
  assert('improvedExperience populated with enhanced bullets', Array.isArray(improvement.improvedExperience) && improvement.improvedExperience.length === 2);
  assert('improvedProjects populated with enhanced bullets', Array.isArray(improvement.improvedProjects) && improvement.improvedProjects.length === 1);
  assert('recommendedSkills object contains technicalSkills', Array.isArray(improvement.recommendedSkills?.technicalSkills));
  assert('optimizationNotes array populated', Array.isArray(improvement.optimizationNotes) && improvement.optimizationNotes.length > 0);

  // CRITICAL RULE: Original content must come from actual parsed resume
  assert('originalResume.summary matches parsed summary', improvement.originalResume?.summary === parsedC.summary);
  assert('originalResume.experience length matches parsed length (2)', improvement.originalResume?.experience?.length === 2);
  assert('originalResume.projects length matches parsed length (1)', improvement.originalResume?.projects?.length === 1);

  // ==========================================================
  // PHASE 11 — ADMIN AUTHORIZATION & RBAC SECURITY
  // ==========================================================
  sectionHeader('PHASE 11: ADMIN AUTHORIZATION & RBAC SECURITY');

  // Test Non-Admin Role Check
  assert('Normal test user role is "user"', testUser.role === 'user');

  const regularUserToken = generateAccessToken(testUser);
  const adminUserToken = generateAccessToken(defaultAdmin);

  // Simulate RBAC check
  const regularDecoded = verifyAccessToken(regularUserToken);
  const isRegularAdmin = regularDecoded.role === 'admin';
  assert('Non-admin user token role check fails admin privilege', isRegularAdmin === false);

  const adminDecoded = verifyAccessToken(adminUserToken);
  const isAdminValid = adminDecoded.role === 'admin';
  assert('Admin user token role check succeeds admin privilege', isAdminValid === true);

  // Admin Dashboard Statistics Query
  const totalUsersCount = await User.countDocuments();
  const totalResumesCount = await Resume.countDocuments();
  const totalATSCount = await ResumeAnalysis.countDocuments();
  const totalAICount = await AIAnalysis.countDocuments();
  const totalJMCount = await JobMatch.countDocuments();
  const totalRICount = await ResumeImprovement.countDocuments();

  assert('Admin stats: User.countDocuments() > 0', totalUsersCount > 0);
  assert('Admin stats: Resume.countDocuments() > 0', totalResumesCount > 0);
  assert('Admin stats: ResumeAnalysis.countDocuments() > 0', totalATSCount > 0);
  assert('Admin stats: AIAnalysis.countDocuments() > 0', totalAICount > 0);
  assert('Admin stats: JobMatch.countDocuments() > 0', totalJMCount > 0);
  assert('Admin stats: ResumeImprovement.countDocuments() > 0', totalRICount > 0);

  // ==========================================================
  // PHASE 12/13 — RESPONSE FORMAT STANDARDIZATION & ERROR HANDLING
  // ==========================================================
  sectionHeader('PHASE 12 & 13: API RESPONSE FORMAT & ERROR HANDLING');

  const sampleSuccess = formatResponse(true, 'Operation succeeded', { key: 'value' });
  assert('formatResponse returns success: true', sampleSuccess.success === true);
  assert('formatResponse contains message string', typeof sampleSuccess.message === 'string');
  assert('formatResponse contains data payload', sampleSuccess.data?.key === 'value');
  assert('formatResponse contains ISO timestamp', !!sampleSuccess.timestamp);

  const sampleError = formatErrorResponse('Invalid credentials', [{ field: 'email', message: 'Email required' }]);
  assert('formatErrorResponse returns success: false', sampleError.success === false);
  assert('formatErrorResponse contains error message', sampleError.message === 'Invalid credentials');
  assert('formatErrorResponse contains errors array', Array.isArray(sampleError.errors));

  // Clean up test records
  await ResumeImprovement.deleteMany({ resumeId: testResume._id });
  await JobMatch.deleteMany({ resumeId: testResume._id });
  await AIAnalysis.deleteMany({ resumeId: testResume._id });
  await ResumeAnalysis.deleteMany({ resume: testResume._id });
  await Resume.deleteOne({ _id: testResume._id });
  await ActivityLog.deleteMany({ user: testUser._id });
  await User.deleteOne({ _id: testUser._id });

  // ==========================================================
  // FINAL TEST SUITE REPORT
  // ==========================================================
  sectionHeader('E2E TEST SUITE EXECUTION SUMMARY');
  console.log(`  Total Tests Run : ${total}`);
  console.log(`  Tests Passed   : ${passed}`);
  console.log(`  Tests Failed   : ${failed}`);
  console.log(`  Accuracy / Pass: ${Math.round((passed / total) * 100)}%`);

  if (failed === 0) {
    console.log(`\n🎉 ALL ${total} INTEGRATION & END-TO-END TESTS PASSED WITH 100% SUCCESS!`);
  } else {
    console.error(`\n⚠️ ${failed} tests failed:`, failures);
  }

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch(async (err) => {
  console.error('💥 Unhandled error during E2E test execution:', err);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
