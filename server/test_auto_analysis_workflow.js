import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import fs from 'fs';
import User from './models/User.js';
import Resume from './models/Resume.js';
import ResumeAnalysis from './models/ResumeAnalysis.js';
import AIAnalysis from './models/AIAnalysis.js';
import { parseAndSaveResume } from './services/resumeParserService.js';
import { evaluateResumeAts } from './services/atsEngineService.js';
import { generateGeminiResumeAnalysis } from './services/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/resume-analyzer';

async function runAutoAnalysisTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING AUTOMATIC COMPLETE RESUME ANALYSIS TEST SUITE');
  console.log('====================================================');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  try {
    // 1. Setup Test User
    let user = await User.findOne({ email: 'test_auto_workflow@example.com' });
    if (!user) {
      user = await User.create({
        fullName: 'Auto Workflow Candidate',
        email: 'test_auto_workflow@example.com',
        password: 'password123',
        role: 'user'
      });
    }

    console.log(`✅ Test User ready: ${user._id} (${user.email})`);

    // Clean up previous test resumes for this test user
    const oldResumes = await Resume.find({ user: user._id });
    for (const r of oldResumes) {
      await ResumeAnalysis.deleteMany({ resume: r._id });
      await AIAnalysis.deleteMany({ resumeId: r._id });
      await Resume.deleteOne({ _id: r._id });
    }
    console.log('🧹 Cleaned up previous test resume records.');

    // 2. TEST CASE 1: Standard Full Software Engineer Resume (1st Resume)
    console.log('\n--- TEST CASE 1: Standard Full Stack Engineer Resume ---');
    const resumeText1 = `
John Doe
johndoe.dev@example.com | (555) 234-5678 | San Francisco, CA
LinkedIn: https://linkedin.com/in/johndoe | GitHub: https://github.com/johndoe

SUMMARY
Results-driven Full Stack Engineer with 4+ years of experience in designing and scaling microservices, React web applications, and cloud-native solutions.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL, HTML5, CSS3
Frameworks & Libraries: React, Node.js, Express, Next.js, Redux, Tailwind CSS
Databases & Cloud: MongoDB, PostgreSQL, Redis, AWS, Docker, CI/CD, Git
Soft Skills: Problem Solving, Team Leadership, Agile Collaboration, Communication

WORK EXPERIENCE
Senior Full Stack Developer | Acme Technologies | Jan 2022 - Present
- Architected and deployed microservices handling 2M+ daily requests with 99.9% uptime.
- Engineered high-performance React dashboard reducing page load times by 42%.
- Integrated Redis caching layer and optimized MongoDB indexes, cutting query latency by 55%.

Software Engineer | Startup Pulse | Jun 2020 - Dec 2021
- Developed RESTful APIs using Node.js and Express for mobile payment gateway.
- Built responsive UI components using React and Tailwind CSS.
- Automated CI/CD deployment pipelines using GitHub Actions and Docker.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2016 - 2020 | GPA: 3.8

PROJECTS
CloudVault — Distributed Cloud Storage Platform
- Built end-to-end encrypted file sharing platform using React, Node.js, and AWS S3.
- Technologies: React, TypeScript, Node.js, AWS, MongoDB

AI Document Summarizer
- Implemented natural language summarizer with vector search and OpenAI API.
- Technologies: Python, FastAPI, React, Redis

CERTIFICATIONS
- AWS Certified Solutions Architect Associate
- MongoDB Certified Developer Associate

LANGUAGES
- English (Fluent), Spanish (Conversational)
    `;

    // Create Resume 1 document
    const resume1 = await Resume.create({
      user: user._id,
      originalName: 'John_Doe_FullStack_Resume.pdf',
      fileName: `test_resume_1_${Date.now()}.pdf`,
      fileType: 'application/pdf',
      fileSize: 1024 * 150,
      uploadPath: 'uploads/test_resume_1.pdf',
      parsedText: resumeText1,
      status: 'uploaded',
      parseStatus: 'pending'
    });

    console.log(`✅ Resume 1 created in DB: ${resume1._id}`);

    // Execute Pipeline Step 1: Parse
    console.log('🔄 Executing Step 1: Parsing Resume 1...');
    const parsedResume1 = await parseAndSaveResume(resume1._id, true);
    console.log(`✅ Parsed Resume 1: FullName = "${parsedResume1.parsedData.fullName}", Email = "${parsedResume1.parsedData.email}", Skills Count = ${parsedResume1.parsedData.skills.length}`);
    if (!parsedResume1.parsedData.fullName || parsedResume1.parsedData.skills.length === 0) {
      throw new Error('Resume 1 parsing failed to extract name or skills.');
    }

    // Execute Pipeline Step 2: ATS Evaluation
    console.log('🔄 Executing Step 2: ATS Score Evaluation for Resume 1...');
    const atsAnalysis1 = await evaluateResumeAts(resume1._id, user._id, true);
    console.log(`✅ ATS Evaluation Complete: Score = ${atsAnalysis1.overallScore}/100, Rating = ${atsAnalysis1.ratingLabel}, Missing Keywords Count = ${atsAnalysis1.missingKeywords.length}`);
    if (typeof atsAnalysis1.overallScore !== 'number' || atsAnalysis1.overallScore <= 0) {
      throw new Error('ATS Evaluation failed to compute numerical overall score.');
    }

    // Execute Pipeline Step 3: Gemini AI Analysis
    console.log('🔄 Executing Step 3: Google Gemini AI Analysis for Resume 1...');
    const aiAnalysis1 = await generateGeminiResumeAnalysis(resume1._id, user._id, true);
    console.log(`✅ AI Analysis Complete: Rating = ${aiAnalysis1.rating}`);
    console.log(`   Summary Excerpt: "${aiAnalysis1.summary.slice(0, 100)}..."`);
    console.log(`   Strengths Count = ${aiAnalysis1.strengths.length}, Career Suggestions = ${aiAnalysis1.careerSuggestions.length}`);
    if (!aiAnalysis1.summary || aiAnalysis1.strengths.length === 0) {
      throw new Error('AI Analysis failed to generate summary or strengths.');
    }

    // Verify DB relationships for Resume 1
    const verifyAts1 = await ResumeAnalysis.findOne({ resume: resume1._id });
    const verifyAi1 = await AIAnalysis.findOne({ resumeId: resume1._id });
    if (!verifyAts1 || !verifyAi1) {
      throw new Error('Verification failed: ATS or AI analysis record not linked to Resume 1 in MongoDB.');
    }
    console.log('✅ DB Relationship verified: User -> Resume 1 -> ParsedData -> ATS Analysis -> AI Analysis');

    // 3. TEST CASE 2: Second Resume (Fresher / Missing Experience & Certifications)
    console.log('\n--- TEST CASE 2: Second Resume (Fresher / Minimal Experience) ---');
    const resumeText2 = `
Jane Smith
janesmith@college.edu | (555) 987-6543 | New York, NY
GitHub: https://github.com/janesmith

EDUCATION
Bachelor of Engineering in Information Technology
New York University | 2022 - 2026 | GPA: 3.9

TECHNICAL SKILLS
Languages: Python, JavaScript, HTML, CSS, C++
Frameworks: React, Express
Databases: PostgreSQL, SQLite

PROJECTS
E-Commerce Bookstore
- Developed responsive shopping cart using React and PostgreSQL.
- Technologies: React, Node.js, PostgreSQL

Portfolio Website
- Personal portfolio site hosted on Vercel.
- Technologies: HTML, CSS, JavaScript
    `;

    const resume2 = await Resume.create({
      user: user._id,
      originalName: 'Jane_Smith_Fresher_Resume.docx',
      fileName: `test_resume_2_${Date.now()}.docx`,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1024 * 80,
      uploadPath: 'uploads/test_resume_2.docx',
      parsedText: resumeText2,
      status: 'uploaded',
      parseStatus: 'pending'
    });

    console.log(`✅ Resume 2 created in DB: ${resume2._id}`);

    // Auto-analyze Resume 2
    const parsedResume2 = await parseAndSaveResume(resume2._id, true);
    const atsAnalysis2 = await evaluateResumeAts(resume2._id, user._id, true);
    const aiAnalysis2 = await generateGeminiResumeAnalysis(resume2._id, user._id, true);

    console.log(`✅ Resume 2 Analyzed: Name = "${parsedResume2.parsedData.fullName}", ATS Score = ${atsAnalysis2.overallScore}/100, AI Rating = ${aiAnalysis2.rating}`);
    console.log(`   ATS Weaknesses identified for missing experience: ${JSON.stringify(atsAnalysis2.weaknesses)}`);

    // Verify 2 resumes exist for user and both have independent analyses
    const totalUserResumes = await Resume.countDocuments({ user: user._id });
    const totalUserAts = await ResumeAnalysis.countDocuments({ user: user._id });
    const totalUserAi = await AIAnalysis.countDocuments({ userId: user._id });
    console.log(`✅ Multi-resume DB Counts for User: Resumes=${totalUserResumes}, ATS=${totalUserAts}, AI=${totalUserAi}`);
    if (totalUserResumes !== 2 || totalUserAts !== 2 || totalUserAi !== 2) {
      throw new Error(`Expected 2 records each, got Resumes=${totalUserResumes}, ATS=${totalUserAts}, AI=${totalUserAi}`);
    }

    // 4. TEST CASE 3: Cache / Performance Verification (No duplicate records or redundant API calls)
    console.log('\n--- TEST CASE 3: Cache Verification (No Duplication on Re-visit) ---');
    const cachedAts = await evaluateResumeAts(resume1._id, user._id, false);
    const cachedAi = await generateGeminiResumeAnalysis(resume1._id, user._id, false);
    const postCacheAtsCount = await ResumeAnalysis.countDocuments({ resume: resume1._id });
    const postCacheAiCount = await AIAnalysis.countDocuments({ resumeId: resume1._id });

    if (postCacheAtsCount !== 1 || postCacheAiCount !== 1) {
      throw new Error('Cache check failed: Duplicate analysis records found in MongoDB.');
    }
    console.log(`✅ Cache verified: Exactly 1 ATS record and 1 AI record exist for Resume 1 (No duplicate creation).`);

    // 5. TEST CASE 4: Isolated Step Retries
    console.log('\n--- TEST CASE 4: Isolated Step Retries ---');
    console.log('🔄 Retrying ATS only for Resume 1...');
    const retriedAts = await evaluateResumeAts(resume1._id, user._id, true);
    console.log(`✅ Retry ATS succeeded: Overall Score = ${retriedAts.overallScore}`);

    console.log('🔄 Retrying AI only for Resume 1...');
    const retriedAi = await generateGeminiResumeAnalysis(resume1._id, user._id, true);
    console.log(`✅ Retry AI succeeded: Summary length = ${retriedAi.summary.length}`);

    // Verify final counts
    const finalAtsCount = await ResumeAnalysis.countDocuments({ resume: resume1._id });
    const finalAiCount = await AIAnalysis.countDocuments({ resumeId: resume1._id });
    if (finalAtsCount !== 1 || finalAiCount !== 1) {
      throw new Error('Retry created duplicate records!');
    }
    console.log('✅ Retries correctly updated in-place without generating duplicate documents.');

    console.log('\n====================================================');
    console.log('🎉 ALL AUTOMATIC RESUME ANALYSIS TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test suite failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runAutoAnalysisTestSuite();
