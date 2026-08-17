/**
 * Live HTTP Test for Candidate Ranking API
 * Tests multipart/form-data upload of 8 resumes, 2 resumes, 5 resumes, and 10 resumes against http://localhost:5000/api/recruiter/rank-resumes
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

// Create a directory for scratch test files
const tempDir = path.join(__dirname, 'scratch_resumes_test');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

function makeHttpRequest(urlPath, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + urlPath);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function buildMultipartFormData(fields, files, boundary) {
  const chunks = [];

  // Add fields
  for (const [key, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
    chunks.push(Buffer.from(`${value}\r\n`));
  }

  // Add files
  for (const file of files) {
    const content = fs.readFileSync(file.path);
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="resumes"; filename="${file.name}"\r\n`));
    chunks.push(Buffer.from(`Content-Type: application/pdf\r\n\r\n`));
    chunks.push(content);
    chunks.push(Buffer.from(`\r\n`));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

function createResumeFile(name, email, skills, expRoles = 1, edu = 'B.Tech') {
  const content = `
${name}
${email} | (555) 123-4567 | City

SUMMARY
Full stack software engineer with hands-on experience in ${skills.slice(0, 3).join(', ')}.

SKILLS
${skills.join(', ')}

EXPERIENCE
${Array.from({ length: expRoles }, (_, i) => `
Senior Developer | Tech Corp ${i + 1} | 202${i} - Present
- Built web services and applications using ${skills[0] || 'Node.js'} and ${skills[1] || 'React'}.
- Improved system performance and API responsiveness.
`).join('\n')}

EDUCATION
${edu} in Computer Science | Institute of Technology | 2020

PROJECTS
Web Platform | ${skills.slice(0, 2).join(', ')}
- Engineered scalable solution.
  `;

  const filePath = path.join(tempDir, `${name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  fs.writeFileSync(filePath, content, 'utf-8');
  return { path: filePath, name: `${name.toLowerCase().replace(/\s+/g, '_')}.pdf` };
}

let passed = 0;
let failed = 0;

function check(label, condition, context = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${label}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${label} ${context ? `(${context})` : ''}`);
  }
}

async function runLiveRankingWorkflow() {
  console.log('\n🚀 Testing Live HTTP Candidate Ranking on http://localhost:5000/api...\n');

  // 1. Admin / Recruiter Login to obtain Bearer token
  const loginRes = await makeHttpRequest('/auth/login', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify({
    email: 'admin@resumeanalyzer.com',
    password: 'Admin@123456'
  }));

  check('Admin login succeeds with 200 OK', loginRes.status === 200);
  const token = loginRes.data?.data?.token;
  check('Obtained valid JWT bearer token', !!token);

  const testJobDescription = 'python, react, html, css, node js';

  // =========================================================================
  // TEST 1: RANKING 8 RESUMES (USER SPECIFIC SCENARIO)
  // =========================================================================
  console.log('\n--- 1. Testing Batch of 8 Resumes (User Scenario) ---');

  const files8 = [
    createResumeFile('Candidate One', 'cand1@test.com', ['Python', 'React', 'HTML', 'CSS', 'Node.js', 'Express', 'MongoDB'], 3),
    createResumeFile('Candidate Two', 'cand2@test.com', ['Python', 'React', 'HTML', 'CSS', 'Node.js'], 2),
    createResumeFile('Candidate Three', 'cand3@test.com', ['React', 'HTML', 'CSS', 'JavaScript'], 2),
    createResumeFile('Candidate Four', 'cand4@test.com', ['Python', 'Node.js', 'Express', 'SQL'], 2),
    createResumeFile('Candidate Five', 'cand5@test.com', ['HTML', 'CSS', 'JavaScript', 'Bootstrap'], 1),
    createResumeFile('Candidate Six', 'cand6@test.com', ['Python', 'Django', 'Flask'], 1),
    createResumeFile('Candidate Seven', 'cand7@test.com', ['Java', 'C++', 'SQL'], 1),
    createResumeFile('Candidate Eight', 'cand8@test.com', ['JavaScript', 'HTML'], 0)
  ];

  const boundary8 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const body8 = buildMultipartFormData(
    {
      jobTitle: 'Full Stack Engineer',
      companyName: 'Apex Cloud Solutions',
      jobDescription: testJobDescription,
      weights: JSON.stringify({
        jobMatchWeight: 0.40,
        atsWeight: 0.30,
        skillWeight: 0.15,
        experienceWeight: 0.10,
        educationWeight: 0.05
      })
    },
    files8,
    boundary8
  );

  const rankRes8 = await makeHttpRequest(
    '/recruiter/rank-resumes',
    'POST',
    {
      'Content-Type': `multipart/form-data; boundary=${boundary8}`,
      'Authorization': `Bearer ${token}`
    },
    body8
  );

  check('POST /api/recruiter/rank-resumes returns 201 Created', rankRes8.status === 201, `Status: ${rankRes8.status}, Message: ${rankRes8.data?.message}`);
  check('Total resumes received is 8', rankRes8.data?.data?.totalResumes === 8);
  check('Processed count is 8', rankRes8.data?.data?.processedCount === 8);
  check('Failed count is 0', rankRes8.data?.data?.failedCount === 0);
  check('Candidates list length is 8', rankRes8.data?.data?.candidates?.length === 8);

  // Check sequential ranks 1 through 8
  const ranks8 = rankRes8.data?.data?.candidates?.map(c => c.rank);
  check('Assigned sequential ranks 1 to 8', JSON.stringify(ranks8) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]), `Ranks: ${JSON.stringify(ranks8)}`);

  // Check monotonic descending score order
  const scores8 = rankRes8.data?.data?.candidates?.map(c => c.overallScore);
  const isSorted8 = scores8.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
  check('8 Candidates sorted by overallScore DESC', isSorted8, `Scores: ${scores8.join(', ')}`);

  // Check Top Candidate is Candidate One
  const top1 = rankRes8.data?.data?.candidates[0];
  check('Rank #1 candidate is Candidate One with highest JD match', top1.candidateName.includes('Candidate One'));
  check('Rank #1 has valid scores', top1.overallScore > 0 && top1.atsScore > 0 && top1.jobMatchScore > 0);

  // =========================================================================
  // TEST 2: RANKING 2 RESUMES
  // =========================================================================
  console.log('\n--- 2. Testing Batch of 2 Resumes ---');
  const files2 = [files8[0], files8[1]];
  const boundary2 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const body2 = buildMultipartFormData(
    {
      jobTitle: 'Frontend Engineer',
      companyName: 'Apex Cloud',
      jobDescription: 'react, html, css, javascript',
      weights: JSON.stringify({ jobMatchWeight: 0.40, atsWeight: 0.30, skillWeight: 0.15, experienceWeight: 0.10, educationWeight: 0.05 })
    },
    files2,
    boundary2
  );

  const rankRes2 = await makeHttpRequest('/recruiter/rank-resumes', 'POST', {
    'Content-Type': `multipart/form-data; boundary=${boundary2}`,
    'Authorization': `Bearer ${token}`
  }, body2);

  check('2 Resumes batch returns 201 Created', rankRes2.status === 201);
  check('2 Resumes processed count is 2', rankRes2.data?.data?.processedCount === 2);
  check('Ranks 1 and 2 assigned', rankRes2.data?.data?.candidates?.map(c => c.rank).join(',') === '1,2');

  // =========================================================================
  // TEST 3: RANKING 5 RESUMES
  // =========================================================================
  console.log('\n--- 3. Testing Batch of 5 Resumes ---');
  const files5 = files8.slice(0, 5);
  const boundary5 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const body5 = buildMultipartFormData(
    {
      jobTitle: 'Web Developer',
      companyName: 'Apex Cloud',
      jobDescription: 'python, react, html, css, node js',
      weights: JSON.stringify({ jobMatchWeight: 0.40, atsWeight: 0.30, skillWeight: 0.15, experienceWeight: 0.10, educationWeight: 0.05 })
    },
    files5,
    boundary5
  );

  const rankRes5 = await makeHttpRequest('/recruiter/rank-resumes', 'POST', {
    'Content-Type': `multipart/form-data; boundary=${boundary5}`,
    'Authorization': `Bearer ${token}`
  }, body5);

  check('5 Resumes batch returns 201 Created', rankRes5.status === 201);
  check('5 Resumes processed count is 5', rankRes5.data?.data?.processedCount === 5);
  check('Ranks 1 to 5 assigned', rankRes5.data?.data?.candidates?.map(c => c.rank).join(',') === '1,2,3,4,5');

  // =========================================================================
  // TEST 4: RANKING 10 RESUMES
  // =========================================================================
  console.log('\n--- 4. Testing Batch of 10 Resumes ---');
  const files10 = [
    ...files8,
    createResumeFile('Candidate Nine', 'cand9@test.com', ['Python', 'FastAPI', 'Docker'], 2),
    createResumeFile('Candidate Ten', 'cand10@test.com', ['React', 'TypeScript', 'Redux'], 3)
  ];
  const boundary10 = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const body10 = buildMultipartFormData(
    {
      jobTitle: 'Senior Full Stack',
      companyName: 'Apex Cloud',
      jobDescription: testJobDescription,
      weights: JSON.stringify({ jobMatchWeight: 0.40, atsWeight: 0.30, skillWeight: 0.15, experienceWeight: 0.10, educationWeight: 0.05 })
    },
    files10,
    boundary10
  );

  const rankRes10 = await makeHttpRequest('/recruiter/rank-resumes', 'POST', {
    'Content-Type': `multipart/form-data; boundary=${boundary10}`,
    'Authorization': `Bearer ${token}`
  }, body10);

  check('10 Resumes batch returns 201 Created', rankRes10.status === 201);
  check('10 Resumes processed count is 10', rankRes10.data?.data?.processedCount === 10);
  check('Ranks 1 to 10 assigned', rankRes10.data?.data?.candidates?.map(c => c.rank).join(',') === '1,2,3,4,5,6,7,8,9,10');

  // =========================================================================
  // TEST 5: SESSIONS RETRIEVAL & DELETION VIA HTTP
  // =========================================================================
  console.log('\n--- 5. Testing GET & DELETE Session Endpoints ---');
  const getRankingsRes = await makeHttpRequest('/recruiter/rankings', 'GET', {
    'Authorization': `Bearer ${token}`
  });
  check('GET /api/recruiter/rankings returns 200 OK', getRankingsRes.status === 200);
  check('Rankings list is an array', Array.isArray(getRankingsRes.data?.data?.rankings));

  const sessionId = rankRes8.data?.data?._id;
  const getSingleRes = await makeHttpRequest(`/recruiter/rankings/${sessionId}`, 'GET', {
    'Authorization': `Bearer ${token}`
  });
  check(`GET /api/recruiter/rankings/${sessionId} returns 200 OK`, getSingleRes.status === 200);
  check('Single session contains 8 candidates', getSingleRes.data?.data?.candidates?.length === 8);

  const deleteRes = await makeHttpRequest(`/recruiter/rankings/${sessionId}`, 'DELETE', {
    'Authorization': `Bearer ${token}`
  });
  check(`DELETE /api/recruiter/rankings/${sessionId} returns 200 OK`, deleteRes.status === 200);

  // Clean up test temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log(`\n======================================================`);
  console.log(`  Live Ranking Workflow Tests Passed: ${passed} / ${passed + failed}`);
  console.log(`======================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runLiveRankingWorkflow().catch((err) => {
  console.error('Error executing live ranking tests:', err);
  process.exit(1);
});
