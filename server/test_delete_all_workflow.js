import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import fs from 'fs';
import User from './models/User.js';
import Resume from './models/Resume.js';
import ResumeAnalysis from './models/ResumeAnalysis.js';
import AIAnalysis from './models/AIAnalysis.js';
import JobMatch from './models/JobMatch.js';
import ResumeImprovement from './models/ResumeImprovement.js';
import { deleteAllResumes, deleteBulkResumes, deleteResume } from './controllers/resumeController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/resume-analyzer';

async function runDeleteTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING DELETE ALL & BULK DELETE RESUMES TEST SUITE');
  console.log('====================================================');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  let passed = 0;
  let total = 0;

  function assert(cond, name) {
    total++;
    if (cond) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
    }
  }

  const testUploadDir = path.join(__dirname, 'uploads', 'test_deletes');
  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
  }

  try {
    // 1. Setup Test User
    let user = await User.findOne({ email: 'test_delete_all@example.com' });
    if (!user) {
      user = await User.create({
        fullName: 'Delete All Tester',
        email: 'test_delete_all@example.com',
        password: 'password123',
        role: 'user'
      });
    }

    // Clean previous test data
    await Resume.deleteMany({ user: user._id });
    await ResumeAnalysis.deleteMany({ user: user._id });
    await AIAnalysis.deleteMany({ userId: user._id });
    await JobMatch.deleteMany({ userId: user._id });

    // Helper to create a mock resume file and DB entries
    const createMockResumeWithData = async (fileName) => {
      const filePath = path.join(testUploadDir, `${Date.now()}_${fileName}`);
      fs.writeFileSync(filePath, 'Mock resume content for deletion testing');

      const resume = await Resume.create({
        user: user._id,
        originalName: fileName,
        fileName: path.basename(filePath),
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadPath: filePath,
        uploadDate: new Date(),
        status: 'uploaded',
        parseStatus: 'parsed'
      });

      const analysis = await ResumeAnalysis.create({
        user: user._id,
        resume: resume._id,
        overallScore: 85,
        keywordScore: 90
      });

      const ai = await AIAnalysis.create({
        userId: user._id,
        resumeId: resume._id,
        summary: 'Experienced software engineer summary'
      });

      const match = await JobMatch.create({
        userId: user._id,
        resumeId: resume._id,
        matchScore: 80,
        jobTitle: 'Software Engineer',
        jobDescription: 'Looking for a dev'
      });

      return { resume, analysis, ai, match, filePath };
    };

    console.log('\n--- STEP 1: Creating 3 mock resumes with analyses and physical files ---');
    const r1 = await createMockResumeWithData('resume_alpha.pdf');
    const r2 = await createMockResumeWithData('resume_beta.pdf');
    const r3 = await createMockResumeWithData('resume_gamma.pdf');

    assert(fs.existsSync(r1.filePath) && fs.existsSync(r2.filePath) && fs.existsSync(r3.filePath), 'Physical test files created on disk');

    const initialResumes = await Resume.find({ user: user._id });
    assert(initialResumes.length === 3, '3 resumes inserted into database for test user');

    // Helper to invoke async handler controller method
    const invokeController = (controllerFn, req) => {
      return new Promise((resolve, reject) => {
        const res = {
          statusCode: 200,
          status(code) { this.statusCode = code; return this; },
          json(data) { resolve({ statusCode: this.statusCode, body: data }); return this; },
          setHeader() {}
        };
        controllerFn(req, res, (err) => {
          if (err) reject(err);
        });
      });
    };

    // Test Bulk Delete on r1
    console.log('\n--- STEP 2: Testing deleteBulkResumes on 1 resume (r1) ---');
    const reqBulk = {
      user,
      body: { ids: [r1.resume._id.toString()] }
    };

    const bulkRes = await invokeController(deleteBulkResumes, reqBulk);
    assert(bulkRes.body?.success === true && bulkRes.body?.data?.count === 1, 'deleteBulkResumes returned success with count 1');
    
    // Give async unlink 100ms
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert(!fs.existsSync(r1.filePath), 'Physical file for r1 removed from disk');
    
    const r1DbCheck = await Resume.findById(r1.resume._id);
    const r1AnalysisCheck = await ResumeAnalysis.findOne({ resume: r1.resume._id });
    const r1AiCheck = await AIAnalysis.findOne({ resumeId: r1.resume._id });
    const r1MatchCheck = await JobMatch.findOne({ resumeId: r1.resume._id });
    assert(!r1DbCheck && !r1AnalysisCheck && !r1AiCheck && !r1MatchCheck, 'r1 database record and all cascade relations deleted');

    const remainingAfterBulk = await Resume.find({ user: user._id });
    assert(remainingAfterBulk.length === 2, '2 resumes remain in database');

    // Test Delete All Resumes (r2, r3)
    console.log('\n--- STEP 3: Testing deleteAllResumes ---');
    const reqAll = { user };
    const allRes = await invokeController(deleteAllResumes, reqAll);

    assert(allRes.body?.success === true && allRes.body?.data?.count === 2, 'deleteAllResumes returned success with count 2');

    // Give async unlink 100ms
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert(!fs.existsSync(r2.filePath) && !fs.existsSync(r3.filePath), 'Physical files for r2 and r3 removed from disk');

    const resumesAfterAll = await Resume.find({ user: user._id });
    const analysesAfterAll = await ResumeAnalysis.find({ user: user._id });
    const aiAfterAll = await AIAnalysis.find({ userId: user._id });
    const matchesAfterAll = await JobMatch.find({ userId: user._id });

    assert(resumesAfterAll.length === 0, 'All resumes deleted from database for user');
    assert(analysesAfterAll.length === 0, 'All resume analyses deleted from database for user');
    assert(aiAfterAll.length === 0, 'All AI analyses deleted from database for user');
    assert(matchesAfterAll.length === 0, 'All JobMatches deleted from database for user');

    // Test Delete All when empty
    console.log('\n--- STEP 4: Testing deleteAllResumes on empty dataset ---');
    const emptyRes = await invokeController(deleteAllResumes, reqAll);
    assert(emptyRes.body?.success === true && emptyRes.body?.data?.count === 0, 'deleteAllResumes on empty dataset returns success count 0');

    // Cleanup test user
    await User.deleteOne({ _id: user._id });

    console.log(`\n========================================`);
    console.log(`Test Summary: ${passed}/${total} assertions passed.`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
    await mongoose.disconnect();
  }
}

runDeleteTests();
