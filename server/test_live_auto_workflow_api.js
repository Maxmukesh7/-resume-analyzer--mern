import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from './models/User.js';
import Resume from './models/Resume.js';
import ResumeAnalysis from './models/ResumeAnalysis.js';
import AIAnalysis from './models/AIAnalysis.js';
import { generateAccessToken } from './utils/jwtHelper.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function runLiveHttpApiTests() {
  console.log('====================================================');
  console.log('🌐 TESTING LIVE AUTO ANALYSIS HTTP API ENDPOINTS');
  console.log('====================================================');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  try {
    // 1. Get or Create user
    let user = await User.findOne({ email: 'test_auto_workflow@example.com' });
    if (!user) {
      user = await User.create({
        fullName: 'Auto Workflow Candidate',
        email: 'test_auto_workflow@example.com',
        password: 'password123'
      });
    }

    const token = generateAccessToken(user);
    console.log('🔑 Generated Auth JWT Token via helper');


    // 2. Create sample resume for HTTP tests
    const sampleResume = await Resume.create({
      user: user._id,
      originalName: 'HTTP_Live_Test_Resume.pdf',
      fileName: `live_test_${Date.now()}.pdf`,
      fileType: 'application/pdf',
      fileSize: 1024 * 120,
      uploadPath: 'uploads/dummy_live.pdf',
      parsedText: `
Alice Walker
alice.walker@techmail.com | 555-432-1098 | Seattle, WA
LinkedIn: linkedin.com/in/alicewalker | GitHub: github.com/alicewalker

SUMMARY
Experienced Frontend Architect with 6+ years specializing in React, TypeScript, Performance Optimization, and Design Systems.

SKILLS
React, TypeScript, Next.js, Redux, Tailwind CSS, Jest, GraphQL, Webpack, Node.js, Git, CI/CD

EXPERIENCE
Lead Frontend Engineer | Pacific Cloud | 2021 - Present
- Spearheaded company-wide migration to React 18 and Next.js, boosting lighthouse performance to 98.
- Built reusable component library downloaded 50,000+ times internally.

Frontend Developer | WebSolutions | 2018 - 2021
- Developed accessible dashboards for enterprise clients using React and Redux.

EDUCATION
Bachelor of Science in Software Engineering | University of Washington | 2014 - 2018

PROJECTS
DesignSystem Pro — Open source accessible React components
- Technologies: React, TypeScript, Storybook
      `,
      status: 'uploaded',
      parseStatus: 'pending'
    });

    console.log(`✅ Created test resume document: ${sampleResume._id}`);

    // 3. Test POST /api/resumes/:id/auto-analyze
    console.log('\n--- 1. Testing POST /api/resumes/:id/auto-analyze ---');
    const autoAnalyzeRes = await fetch(`${API_BASE}/resumes/${sampleResume._id}/auto-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ force: true })
    });

    if (!autoAnalyzeRes.ok) {
      const errBody = await autoAnalyzeRes.text();
      throw new Error(`auto-analyze returned status ${autoAnalyzeRes.status}: ${errBody}`);
    }

    const autoAnalyzeData = await autoAnalyzeRes.json();
    console.log('✅ auto-analyze response status:', autoAnalyzeRes.status);
    console.log('   state:', autoAnalyzeData.data?.state);
    console.log('   stageStatuses:', JSON.stringify(autoAnalyzeData.data?.stageStatuses));
    console.log('   ATS overallScore:', autoAnalyzeData.data?.atsAnalysis?.overallScore);
    console.log('   AI rating:', autoAnalyzeData.data?.aiAnalysis?.rating);

    if (!autoAnalyzeData.data?.atsAnalysis || !autoAnalyzeData.data?.aiAnalysis) {
      throw new Error('auto-analyze did not return both ATS and AI analysis results.');
    }

    // 4. Test GET /api/resumes/:id/complete-analysis
    console.log('\n--- 2. Testing GET /api/resumes/:id/complete-analysis ---');
    const completeRes = await fetch(`${API_BASE}/resumes/${sampleResume._id}/complete-analysis`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!completeRes.ok) {
      const errBody = await completeRes.text();
      throw new Error(`complete-analysis returned status ${completeRes.status}: ${errBody}`);
    }

    const completeData = await completeRes.json();
    console.log('✅ complete-analysis response status:', completeRes.status);
    console.log('   Candidate Name:', completeData.data?.resume?.parsedData?.fullName);
    console.log('   ATS Score:', completeData.data?.atsAnalysis?.overallScore);
    console.log('   AI Summary Excerpt:', completeData.data?.aiAnalysis?.summary?.slice(0, 80));
    console.log('   Status state:', completeData.data?.status?.state);

    if (completeData.data?.status?.state !== 'COMPLETED') {
      throw new Error(`Expected state COMPLETED, got ${completeData.data?.status?.state}`);
    }

    // 5. Test Isolated Re-Analyze ATS: POST /api/resumes/:id/analyze
    console.log('\n--- 3. Testing POST /api/resumes/:id/analyze ---');
    const retryAtsRes = await fetch(`${API_BASE}/resumes/${sampleResume._id}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ force: true })
    });
    console.log('✅ Isolated ATS analyze response status:', retryAtsRes.status);

    // 6. Test Isolated Re-Analyze AI: POST /api/ai/analyze/:resumeId
    console.log('\n--- 4. Testing POST /api/ai/analyze/:resumeId ---');
    const retryAiRes = await fetch(`${API_BASE}/ai/analyze/${sampleResume._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ force: true })
    });
    console.log('✅ Isolated AI analyze response status:', retryAiRes.status);

    // Clean up sample resume
    await ResumeAnalysis.deleteMany({ resume: sampleResume._id });
    await AIAnalysis.deleteMany({ resumeId: sampleResume._id });
    await Resume.deleteOne({ _id: sampleResume._id });
    console.log('🧹 Cleaned up sample resume.');

    console.log('\n====================================================');
    console.log('🎉 ALL LIVE HTTP API TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Live HTTP API test failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runLiveHttpApiTests();
