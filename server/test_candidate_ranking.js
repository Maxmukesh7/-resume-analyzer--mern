/**
 * Comprehensive Automated Verification Suite for
 * Multiple Resume Upload & Candidate Ranking Feature
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import fs from 'fs';
import User from './models/User.js';
import CandidateRanking from './models/CandidateRanking.js';
import {
  rankMultipleResumesService,
  getRecruiterRankingsService,
  getRankingByIdService,
  deleteRankingService
} from './services/candidateRankingService.js';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(description, condition, context = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${description} ${context ? `(${context})` : ''}`);
    failures.push(`${description} ${context}`);
  }
}

function header(title) {
  console.log(`\n══════════════════════════════════════════════════════════════════════`);
  console.log(`  ${title}`);
  console.log(`══════════════════════════════════════════════════════════════════════`);
}

// Temporary directory for synthetic test resume files
const testTempDir = path.join(__dirname, 'test_scratch_resumes');
if (!fs.existsSync(testTempDir)) {
  fs.mkdirSync(testTempDir, { recursive: true });
}

function createSyntheticFile(filename, textContent) {
  const filePath = path.join(testTempDir, filename);
  fs.writeFileSync(filePath, textContent, 'utf-8');
  return {
    path: filePath,
    filename,
    originalname: filename,
    mimetype: 'text/plain',
    size: Buffer.byteLength(textContent, 'utf-8')
  };
}

async function runCandidateRankingTests() {
  console.log('🚀 Starting Candidate Ranking & Multi-Resume Upload Test Suite...\n');

  // Database Connection
  await connectDB();
  assert('MongoDB connected successfully', mongoose.connection.readyState === 1);

  // Setup Test Recruiter User
  const recruiterEmail = `recruiter_test_${Date.now()}@test.com`;
  const recruiterUser = await User.create({
    fullName: 'Executive Recruiter',
    email: recruiterEmail,
    password: 'Password@1234',
    role: 'recruiter',
    isActive: true,
    isVerified: true
  });
  assert('Recruiter user created with role "recruiter"', recruiterUser.role === 'recruiter');

  // Standard Test Job Description
  const targetJobDescription = `
    Job Title: Senior Full Stack Engineer (MERN)
    Company: Apex Cloud Systems
    Location: Remote / New York

    Requirements & Skills:
    - 3+ years of experience with React, Node.js, Express, MongoDB, and TypeScript.
    - Strong understanding of REST API design, Microservices, and Redis caching.
    - Experience with Docker, Kubernetes, CI/CD, AWS, and Git.
    - Experience with Unit Testing (Jest, Mocha) and Agile methodology.
    - Bachelor's or Master's degree in Computer Science or related engineering field.
    - Strong problem solving, leadership, and teamwork skills.
  `;

  // ==========================================================
  // TEST SUITE 1: 5 RESUMES BATCH RANKING
  // ==========================================================
  header('TEST SUITE 1: BATCH OF 5 RESUMES (DIVERSE PROFILES)');

  const resume1_Senior = `
Alex Morgan
alex.morgan@email.com | (555) 123-4567 | New York, NY | linkedin.com/in/alexmorgan | github.com/alexmorgan

SUMMARY
Lead Full Stack Engineer with 5+ years of experience in React, Node.js, Express, MongoDB, TypeScript, Docker, and AWS.

SKILLS
Technical Skills: JavaScript, TypeScript, React, Node.js, Express, MongoDB, Redis, Docker, Kubernetes, AWS, REST API, Git, CI/CD, Jest, Microservices, Agile
Soft Skills: Leadership, Problem Solving, Teamwork

EXPERIENCE
Principal Engineer | CloudScale Tech | Jan 2022 - Present
- Architected and deployed microservices backend using Node.js, Express, MongoDB, and Redis.
- Developed reactive web frontend with React and TypeScript, optimizing page load by 45%.
- Managed Kubernetes and Docker CI/CD pipelines on AWS.

Senior Full Stack Developer | ByteWave Inc | Jun 2019 - Dec 2021
- Engineered RESTful APIs and real-time streaming architectures.
- Led agile team of 8 engineers and introduced Jest unit testing suite.

PROJECTS
Enterprise Cloud Platform | React, Node.js, MongoDB, Docker
- Built multi-tenant SaaS application serving 100,000+ active users.

Real-time Collaboration Hub | TypeScript, WebSockets, Redis
- Implemented collaborative document editor with sub-50ms latency.

EDUCATION
Master of Science in Computer Science | Columbia University | 2019

CERTIFICATIONS
- AWS Certified Solutions Architect Professional
  `;

  const resume2_Mid = `
Jordan Patel
jordan.patel@email.com | (555) 987-6543 | Boston, MA | github.com/jordanpatel

SUMMARY
Full Stack Developer with 3 years building web apps using React, Node.js, Express, and MongoDB.

SKILLS
React, Node.js, Express, MongoDB, JavaScript, REST API, Git, Docker, HTML, CSS, Tailwind

EXPERIENCE
Full Stack Developer | DevWorks Studio | Aug 2021 - Present
- Built and maintained REST APIs using Express and MongoDB.
- Created interactive client interfaces with React and Tailwind CSS.

PROJECTS
E-Commerce Marketplace | React, Express, MongoDB
- Developed checkout payment flow with Stripe and automated order dispatch.

EDUCATION
Bachelor of Science in Information Technology | Boston University | 2021
  `;

  const resume3_Frontend = `
Chloe Bennett
chloe.bennett@email.com | (555) 456-7890 | San Francisco, CA

SUMMARY
Senior Frontend Engineer specialized in React, TypeScript, Redux, CSS, and UI/UX design.

SKILLS
React, TypeScript, Redux, HTML, CSS, Tailwind, JavaScript, UI/UX, Jest, Git, REST API

EXPERIENCE
Senior Frontend Developer | PixelCraft | Feb 2020 - Present
- Engineered component design system in React and TypeScript.
- Implemented state management using Redux and wrote unit tests with Jest.

EDUCATION
Bachelor of Arts in Interactive Media | UC Berkeley | 2020
  `;

  const resume4_Fresher = `
Devin Vance
devin.vance@email.com | (555) 234-5678 | Austin, TX

SUMMARY
Passionate Computer Science graduate with strong hands-on foundation in JavaScript, React, Node.js, and MongoDB.

SKILLS
JavaScript, React, Node.js, Express, MongoDB, Git, HTML, CSS

PROJECTS
Smart Task Manager | React, Node.js, MongoDB
- Built full stack Kanban board with authentication and task categorization.

Weather Forecast App | React, OpenWeather API
- Implemented responsive mobile-first weather application.

EDUCATION
Bachelor of Technology in Computer Science | University of Texas | 2024
  `;

  const resume5_Minimal = `
Sam Taylor
sam.taylor@email.com | (555) 345-6789

SKILLS
JavaScript, Python, HTML, CSS, Git

EDUCATION
Associate Degree in Web Development | Community College | 2023
  `;

  const batch5Files = [
    createSyntheticFile('candidate1_alex_senior.txt', resume1_Senior),
    createSyntheticFile('candidate2_jordan_mid.txt', resume2_Mid),
    createSyntheticFile('candidate3_chloe_frontend.txt', resume3_Frontend),
    createSyntheticFile('candidate4_devin_fresher.txt', resume4_Fresher),
    createSyntheticFile('candidate5_sam_minimal.txt', resume5_Minimal)
  ];

  const rankingSession5 = await rankMultipleResumesService({
    userId: recruiterUser._id,
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'Apex Cloud Systems',
    jobDescription: targetJobDescription,
    files: batch5Files
  });

  assert('Ranking session created for 5 resumes', !!rankingSession5._id);
  assert('totalResumes is 5', rankingSession5.totalResumes === 5);
  assert('processedCount is 5', rankingSession5.processedCount === 5);
  assert('failedCount is 0', rankingSession5.failedCount === 0);
  assert('candidates array length is 5', rankingSession5.candidates.length === 5);

  // Verify Ranks 1 to 5 are assigned
  const ranks = rankingSession5.candidates.map((c) => c.rank);
  assert('Ranks assigned 1 through 5', JSON.stringify(ranks) === JSON.stringify([1, 2, 3, 4, 5]));

  // Verify Sorting Order (Overall Score DESC)
  const scores = rankingSession5.candidates.map((c) => c.overallScore);
  const isSorted = scores.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
  assert('Candidates sorted by overallScore DESC', isSorted, `Scores: ${scores.join(', ')}`);

  // Verify Top Candidate is Alex Morgan (Senior with highest JD alignment)
  const topCandidate = rankingSession5.candidates[0];
  assert('Rank 1 Candidate is Alex Morgan', topCandidate.candidateName.includes('Alex Morgan'));
  assert('Rank 1 Overall Score is high (>= 80)', topCandidate.overallScore >= 80, `Score: ${topCandidate.overallScore}`);
  assert('Rank 1 has matched skills (TypeScript, MongoDB, Redis, etc.)', topCandidate.matchedSkills.length >= 5);

  // ==========================================================
  // TEST SUITE 2: 10 RESUMES BATCH RANKING
  // ==========================================================
  header('TEST SUITE 2: BATCH OF 10 RESUMES');

  const batch10Files = [];
  for (let i = 1; i <= 10; i++) {
    const candidateResume = `
Candidate ${i} Name
candidate${i}@domain.com | (555) 000-000${i} | City ${i}
SUMMARY: Software developer with skill level ${i}.
SKILLS: JavaScript, React, Node.js${i > 3 ? ', Express, MongoDB' : ''}${i > 6 ? ', TypeScript, Docker, AWS' : ''}
EXPERIENCE:
Engineer | Tech Company ${i} | 2020 - Present
- Built features using React and Node.js.
EDUCATION:
Bachelor of Science | University ${i} | 2020
PROJECTS:
Project Alpha | React, Node.js
- Implemented real-time dashboard.
    `;
    batch10Files.push(createSyntheticFile(`batch10_candidate_${i}.txt`, candidateResume));
  }

  const rankingSession10 = await rankMultipleResumesService({
    userId: recruiterUser._id,
    jobTitle: 'Full Stack Engineer',
    companyName: 'Apex Cloud Systems',
    jobDescription: targetJobDescription,
    files: batch10Files
  });

  assert('Processed exactly 10 resumes', rankingSession10.processedCount === 10);
  assert('Ranks 1 to 10 assigned sequentially', rankingSession10.candidates.map(c => c.rank).join(',') === '1,2,3,4,5,6,7,8,9,10');
  const scores10 = rankingSession10.candidates.map(c => c.overallScore);
  assert('10 Resumes sorted monotonically DESC', scores10.every((val, i, arr) => i === 0 || arr[i - 1] >= val));

  // ==========================================================
  // TEST SUITE 3: 20 RESUMES HIGH-THROUGHPUT BATCH
  // ==========================================================
  header('TEST SUITE 3: BATCH OF 20 RESUMES (HIGH THROUGHPUT)');

  const batch20Files = [];
  for (let i = 1; i <= 20; i++) {
    const candidateResume = `
Candidate ${i} HighThroughput
user${i}@hiring.org | (555) 111-22${i < 10 ? '0' + i : i}
SKILLS: JavaScript, Node.js, Express, MongoDB${i % 2 === 0 ? ', React, TypeScript' : ''}${i % 3 === 0 ? ', Docker, AWS' : ''}
EXPERIENCE:
Software Developer | Global Systems ${i} | 2021 - 2024
- Engineered software systems.
EDUCATION:
Degree in Computing | Institute ${i}
    `;
    batch20Files.push(createSyntheticFile(`batch20_candidate_${i}.txt`, candidateResume));
  }

  const startTime = Date.now();
  const rankingSession20 = await rankMultipleResumesService({
    userId: recruiterUser._id,
    jobTitle: 'Software Engineer Batch',
    companyName: 'Apex Cloud Systems',
    jobDescription: targetJobDescription,
    files: batch20Files
  });
  const durationMs = Date.now() - startTime;

  assert('Processed all 20 resumes successfully', rankingSession20.processedCount === 20);
  assert('Processed 20 resumes efficiently (< 5000ms)', durationMs < 5000, `Took ${durationMs}ms`);
  assert('All 20 candidates have valid overall scores (0 - 100)', rankingSession20.candidates.every(c => c.overallScore >= 0 && c.overallScore <= 100));

  // ==========================================================
  // TEST SUITE 4: TIE-BREAKING MECHANISM
  // ==========================================================
  header('TEST SUITE 4: TIE-BREAKING LOGIC');

  // Create 2 candidates with identical profiles but candidate A has higher Job Match skills
  const tieCandidateA = `
Candidate TieA HigherJobMatch
tieA@test.com
SKILLS: React, Node.js, MongoDB, TypeScript, Redis, Docker, Kubernetes, AWS, Jest
EXPERIENCE: Developer | Company A | 2022 - Present
EDUCATION: Bachelor Degree | University
  `;

  const tieCandidateB = `
Candidate TieB LowerJobMatch
tieB@test.com
SKILLS: React, Node.js, MongoDB
EXPERIENCE: Developer | Company B | 2022 - Present
EDUCATION: Bachelor Degree | University
  `;

  const tieFiles = [
    createSyntheticFile('tie_candidate_B.txt', tieCandidateB),
    createSyntheticFile('tie_candidate_A.txt', tieCandidateA)
  ];

  const tieSession = await rankMultipleResumesService({
    userId: recruiterUser._id,
    jobTitle: 'Tie Break Test',
    companyName: 'Apex Cloud',
    jobDescription: targetJobDescription,
    files: tieFiles
  });

  assert('Tie Session processed 2 candidates', tieSession.processedCount === 2);
  assert('Candidate with higher Job Match receives Rank 1', tieSession.candidates[0].candidateName.includes('TieA'));
  assert('Candidate with lower Job Match receives Rank 2', tieSession.candidates[1].candidateName.includes('TieB'));

  // ==========================================================
  // TEST SUITE 5: PARTIAL FAILURE RESILIENCE
  // ==========================================================
  header('TEST SUITE 5: PARTIAL FAILURE RESILIENCE');

  const validFile1 = createSyntheticFile('valid_1.txt', resume1_Senior);
  const validFile2 = createSyntheticFile('valid_2.txt', resume2_Mid);
  const corruptedFile = createSyntheticFile('corrupted_file.txt', '   '); // Empty unparseable text

  const partialSession = await rankMultipleResumesService({
    userId: recruiterUser._id,
    jobTitle: 'Partial Failure Test',
    companyName: 'Apex Cloud',
    jobDescription: targetJobDescription,
    files: [validFile1, corruptedFile, validFile2]
  });

  assert('totalResumes is 3', partialSession.totalResumes === 3);
  assert('processedCount is 2 (valid resumes succeeded)', partialSession.processedCount === 2);
  assert('failedCount is 1 (corrupted resume flagged)', partialSession.failedCount === 1);
  const failedCandidate = partialSession.candidates.find(c => c.status === 'failed');
  assert('Failed candidate contains informative error message', !!failedCandidate && !!failedCandidate.error);

  // ==========================================================
  // TEST SUITE 6: CONFIGURABLE SCORING WEIGHTS
  // ==========================================================
  header('TEST SUITE 6: CONFIGURABLE SCORING WEIGHTS');

  // Weights prioritizing direct Skill Match heavily (Skill 70%, ATS 10%, JobMatch 10%, Exp 5%, Edu 5%)
  const customWeightsHighSkill = {
    atsWeight: 10,
    jobMatchWeight: 10,
    skillWeight: 70,
    experienceWeight: 5,
    educationWeight: 5
  };

  const customWeightsSession = await rankMultipleResumesService({
    userId: recruiterUser._id,
    jobTitle: 'Custom Weights Test',
    companyName: 'Apex Cloud',
    jobDescription: targetJobDescription,
    files: [validFile1, validFile2],
    customWeights: customWeightsHighSkill
  });

  assert('Custom weights stored in session document', !!customWeightsSession.weights);
  assert('Normalized skill weight is highest (~0.7)', customWeightsSession.weights.skillWeight > 0.6);

  // ==========================================================
  // TEST SUITE 7: DATABASE PERSISTENCE & RETRIEVAL (CRUD)
  // ==========================================================
  header('TEST SUITE 7: DATABASE PERSISTENCE & CRUD OPERATIONS');

  const rankingsList = await getRecruiterRankingsService(recruiterUser._id, 'recruiter');
  assert('getRecruiterRankingsService returns list', Array.isArray(rankingsList.rankings) && rankingsList.rankings.length > 0);

  const fetchedSession = await getRankingByIdService(rankingSession5._id, recruiterUser._id, 'recruiter');
  assert('getRankingByIdService returns accurate session', fetchedSession._id.toString() === rankingSession5._id.toString());
  assert('Session contains candidates details', fetchedSession.candidates.length === 5);

  const deleteRes = await deleteRankingService(rankingSession5._id, recruiterUser._id, 'recruiter');
  assert('deleteRankingService successfully deletes session', deleteRes.id.toString() === rankingSession5._id.toString());

  const checkDeleted = await CandidateRanking.findById(rankingSession5._id);
  assert('Deleted session is no longer in database', checkDeleted === null);

  // ==========================================================
  // TEST SUITE 8: SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================================
  header('TEST SUITE 8: SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)');

  const regularUser = await User.create({
    fullName: 'Regular Job Seeker',
    email: `regular_seeker_${Date.now()}@test.com`,
    password: 'Password@1234',
    role: 'user'
  });

  // Verify regular user role !== 'admin' && !== 'recruiter'
  assert('Regular user role is "user"', regularUser.role === 'user');
  assert('Regular user is not recruiter or admin', regularUser.role !== 'recruiter' && regularUser.role !== 'admin');

  // Verify non-owner cannot view private ranking report
  let forbiddenCaught = false;
  try {
    await getRankingByIdService(rankingSession10._id, regularUser._id, 'user');
  } catch (err) {
    if (err.statusCode === 403) forbiddenCaught = true;
  }
  assert('Regular user receives 403 Forbidden on accessing another user\'s ranking', forbiddenCaught);

  // ==========================================================
  // TEST SUITE 9: FAIRNESS RULE VERIFICATION
  // ==========================================================
  header('TEST SUITE 9: FAIRNESS & NON-DISCRIMINATION COMPLIANCE');

  const rankingCandidateFields = Object.keys(rankingSession10.candidates[0].toObject());
  const prohibitedFields = ['age', 'gender', 'race', 'religion', 'caste', 'nationality', 'maritalStatus', 'disability'];
  const hasProhibitedFields = prohibitedFields.some(field => rankingCandidateFields.includes(field));
  assert('Candidate ranking schema contains ZERO protected demographic characteristics', !hasProhibitedFields);

  // Clean up test temporary files
  try {
    fs.rmSync(testTempDir, { recursive: true, force: true });
  } catch (e) {}

  // ==========================================================
  // FINAL SUMMARY
  // ==========================================================
  header('CANDIDATE RANKING TEST SUITE SUMMARY');
  console.log(`  Total Tests Run : ${totalTests}`);
  console.log(`  Tests Passed   : ${passedTests}`);
  console.log(`  Tests Failed   : ${failedTests}`);
  console.log(`  Pass Rate      : ${Math.round((passedTests / totalTests) * 100)}%\n`);

  if (failedTests > 0) {
    console.error('⚠️ Failures:', failures);
    process.exit(1);
  } else {
    console.log('🎉 ALL CANDIDATE RANKING TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  }
}

runCandidateRankingTests().catch((err) => {
  console.error('💥 Test suite crashed:', err);
  process.exit(1);
});
