import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rankMultipleResumesService } from './services/candidateRankingService.js';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testMukeshSkillAccuracy() {
  console.log('\n🔍 Testing Skill Matching Accuracy on Mukesh Kumar Resume...\n');

  await connectDB();

  const resumeText = `
MUKESH KUMAR R
mukesh2004777@gmail.com | 2004777 | India

SUMMARY
Passionate developer with strong foundation in frontend and backend scripting.

TECHNICAL SKILL
Front-End: HTML, CSS
Programming Languages: Python, Core Java
Tools & Tech: Linux, Git, GitHub, Jenkins, Docker, Vs code
Data Base: MySQL
Scripting language: Bash

EDUCATION
B.Tech in Computer Science | SSLC Board - PASS

PROJECTS
Web Application
- Developed full stack web app with Python and MySQL.
`;

  const tempFile = path.join(__dirname, 'test_mukesh_accuracy.txt');
  fs.writeFileSync(tempFile, resumeText, 'utf-8');

  const files = [{
    path: tempFile,
    originalname: 'Mukesh_Kumar_R.txt',
    mimetype: 'text/plain',
    size: Buffer.byteLength(resumeText)
  }];

  const jobDescription = 'python, react, html, css, sql, mongodb';
  const dummyUserId = new mongoose.Types.ObjectId();

  const result = await rankMultipleResumesService({
    files,
    jobTitle: 'Full Stack Engineer',
    companyName: 'Tech Corp',
    jobDescription,
    userId: dummyUserId
  });

  const cand = result.candidates[0];
  console.log('Candidate Name:', cand.candidateName);
  console.log('Matched Skills:', cand.matchedSkills);
  console.log('Missing Skills:', cand.missingSkills);

  let passed = true;

  // 1. React MUST NOT be in matchedSkills
  if (cand.matchedSkills.some(s => s.toLowerCase() === 'react')) {
    console.error('❌ FAIL: React should NOT be in matchedSkills!');
    passed = false;
  } else {
    console.log('✅ PASS: React is NOT falsely matched');
  }

  // 2. React MUST be in missingSkills
  if (cand.missingSkills.some(s => s.toLowerCase() === 'react')) {
    console.log('✅ PASS: React is correctly identified as Missing');
  } else {
    console.error('❌ FAIL: React should be in missingSkills!');
    passed = false;
  }

  // 3. MongoDB MUST be in missingSkills
  if (cand.missingSkills.some(s => s.toLowerCase() === 'mongodb')) {
    console.log('✅ PASS: MongoDB is correctly identified as Missing');
  } else {
    console.error('❌ FAIL: MongoDB should be in missingSkills!');
    passed = false;
  }

  // 4. Python, HTML, CSS, SQL MUST be in matchedSkills
  const hasPython = cand.matchedSkills.some(s => s.toLowerCase() === 'python');
  const hasHTML = cand.matchedSkills.some(s => s.toLowerCase() === 'html');
  const hasCSS = cand.matchedSkills.some(s => s.toLowerCase() === 'css');
  const hasSQL = cand.matchedSkills.some(s => s.toLowerCase() === 'sql');

  if (hasPython && hasHTML && hasCSS && hasSQL) {
    console.log('✅ PASS: Python, HTML, CSS, and SQL are all matched');
  } else {
    console.error('❌ FAIL: Missing expected matched skills');
    passed = false;
  }

  // 5. Check ZERO duplicate casing entries
  const matchedLower = cand.matchedSkills.map(s => s.toLowerCase());
  const uniqueMatched = new Set(matchedLower);
  if (matchedLower.length === uniqueMatched.size) {
    console.log('✅ PASS: No duplicate casing in matchedSkills');
  } else {
    console.error('❌ FAIL: Duplicate entries found in matchedSkills');
    passed = false;
  }

  const missingLower = cand.missingSkills.map(s => s.toLowerCase());
  const uniqueMissing = new Set(missingLower);
  if (missingLower.length === uniqueMissing.size) {
    console.log('✅ PASS: No duplicate casing in missingSkills');
  } else {
    console.error('❌ FAIL: Duplicate entries found in missingSkills');
    passed = false;
  }

  try {
    fs.unlinkSync(tempFile);
  } catch (e) {}

  await mongoose.disconnect();

  if (passed) {
    console.log('\n🎉 ALL SKILL ACCURACY CHECKS PASSED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testMukeshSkillAccuracy().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
