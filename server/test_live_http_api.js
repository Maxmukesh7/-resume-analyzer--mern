/**
 * Live HTTP API Endpoint Verification Suite
 * Tests actual HTTP request/response handling on the running server (http://localhost:5000/api)
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

async function makeRequest(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
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
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${label}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${label}`);
  }
}

async function runLiveHttpTests() {
  console.log('\n🌐 Running Live HTTP API Endpoint Integration Tests on http://localhost:5000/api...\n');

  // 1. Health Check
  const health = await makeRequest('/health');
  check('GET /api/health returns 200 OK', health.status === 200);
  check('Health check reports database Connected', health.data?.database === 'Connected');

  // 2. Auth - Register Invalid Email
  const badReg = await makeRequest('/auth/register', { method: 'POST' }, {
    fullName: 'Test User',
    email: 'invalid-email',
    password: 'Password@1234',
    confirmPassword: 'Password@1234'
  });
  check('POST /api/auth/register with invalid email returns 400 Bad Request', badReg.status === 400);
  check('Error response has success: false', badReg.data?.success === false);

  // 3. Auth - Register Weak Password
  const weakPassReg = await makeRequest('/auth/register', { method: 'POST' }, {
    fullName: 'Test User',
    email: `valid_${Date.now()}@test.com`,
    password: '123',
    confirmPassword: '123'
  });
  check('POST /api/auth/register with weak password returns 400 Bad Request', weakPassReg.status === 400);

  // 4. Auth - Successful Registration
  const testUserEmail = `live_http_user_${Date.now()}@test.com`;
  const reg = await makeRequest('/auth/register', { method: 'POST' }, {
    fullName: 'Live HTTP Tester',
    email: testUserEmail,
    password: 'Password@1234',
    confirmPassword: 'Password@1234'
  });
  check('POST /api/auth/register returns 201 Created', reg.status === 201);
  check('Registration returns JWT token', !!reg.data?.data?.token);
  const userToken = reg.data?.data?.token;

  // 5. Auth - Duplicate Registration
  const dupReg = await makeRequest('/auth/register', { method: 'POST' }, {
    fullName: 'Live HTTP Tester',
    email: testUserEmail,
    password: 'Password@1234',
    confirmPassword: 'Password@1234'
  });
  check('POST /api/auth/register duplicate email returns 409 Conflict', dupReg.status === 409);

  // 6. Auth - Login Incorrect Password
  const badLogin = await makeRequest('/auth/login', { method: 'POST' }, {
    email: testUserEmail,
    password: 'WrongPassword@999'
  });
  check('POST /api/auth/login with incorrect password returns 401 Unauthorized', badLogin.status === 401);

  // 7. Auth - Login Correct
  const goodLogin = await makeRequest('/auth/login', { method: 'POST' }, {
    email: testUserEmail,
    password: 'Password@1234'
  });
  check('POST /api/auth/login returns 200 OK', goodLogin.status === 200);
  check('Login returns access token', !!goodLogin.data?.data?.token);

  // 8. Protected Route - Profile with Token
  const profile = await makeRequest('/auth/profile', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('GET /api/auth/profile with Bearer token returns 200 OK', profile.status === 200);
  check('Profile fullName matches registered user', profile.data?.data?.fullName === 'Live HTTP Tester');

  // 9. Protected Route - Without Token
  const noToken = await makeRequest('/auth/profile');
  check('GET /api/auth/profile without token returns 401 Unauthorized', noToken.status === 401);

  // 10. Security: Non-Admin Accessing Admin Endpoint
  const nonAdminAccess = await makeRequest('/admin/dashboard', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('GET /api/admin/dashboard with regular user token returns 403 Forbidden', nonAdminAccess.status === 403);

  const nonAdminUsers = await makeRequest('/admin/users', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('GET /api/admin/users with regular user token returns 403 Forbidden', nonAdminUsers.status === 403);

  const nonAdminResumes = await makeRequest('/admin/resumes', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('GET /api/admin/resumes with regular user token returns 403 Forbidden', nonAdminResumes.status === 403);

  // 11. Admin Login & Access
  const adminLogin = await makeRequest('/auth/login', { method: 'POST' }, {
    email: 'admin@resumeanalyzer.com',
    password: 'Admin@123456'
  });
  check('POST /api/auth/login as Admin returns 200 OK', adminLogin.status === 200);
  const adminToken = adminLogin.data?.data?.token;

  const adminDashboard = await makeRequest('/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('GET /api/admin/dashboard as Admin returns 200 OK', adminDashboard.status === 200);
  check('Admin dashboard data contains totalUsers', typeof adminDashboard.data?.data?.totalUsers === 'number');

  const adminUserList = await makeRequest('/admin/users?limit=5', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  check('GET /api/admin/users as Admin returns 200 OK', adminUserList.status === 200);
  check('Admin user list contains users array', Array.isArray(adminUserList.data?.data?.users));

  // 12. Non-existent Route (404)
  const notFoundRes = await makeRequest('/non-existent-route');
  check('GET non-existent route returns 404 Not Found', notFoundRes.status === 404);
  check('404 response follows standard format', notFoundRes.data?.success === false);

  // 13. Invalid ID CastError
  const invalidIdRes = await makeRequest('/resume/invalid-mongo-id-12345', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  check('GET /api/resume/invalid-id returns 400 Bad Request', invalidIdRes.status === 400);

  console.log(`\n======================================================`);
  console.log(`  Live HTTP Tests Passed: ${passed} / ${passed + failed}`);
  console.log(`======================================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runLiveHttpTests().catch((err) => {
  console.error('Error running live HTTP tests:', err);
  process.exit(1);
});
