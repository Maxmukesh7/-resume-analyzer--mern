/**
 * Production CORS & Cross-Origin External Browser Authentication Test Suite
 * 
 * Verifies that external browsers/devices on non-localhost domains (Render, Vercel, Netlify, Custom Domains)
 * can successfully execute preflight OPTIONS, cross-origin register, login, session refresh,
 * and authenticated API calls with full CORS and credentials compliance.
 */

import http from 'http';
import app from './server.js';
import mongoose from 'mongoose';

const PORT = 5000;
const EXTERNAL_ORIGINS = [
  'https://friend-resume-client.onrender.com',
  'https://resume-analyzer.vercel.app',
  'https://resume-scanner.netlify.app',
  'https://resume-app.github.io',
  'http://localhost:5173'
];

function makeRawRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: data
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(label, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${label}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${label} ${details ? `(${details})` : ''}`);
  }
}

// Wait for database and server to initialize
setTimeout(async () => {
  console.log('\n======================================================================');
  console.log('  🌐 PRODUCTION CORS & CROSS-ORIGIN EXTERNAL AUTHENTICATION TEST SUITE');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Preflight OPTIONS request from external Vercel frontend origin
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing Preflight OPTIONS on /api/auth/login ---');
    const vercelOrigin = 'https://resume-analyzer.vercel.app';
    const preflightLogin = await makeRawRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': vercelOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    });

    assert(
      'OPTIONS /api/auth/login responds with status 204 No Content',
      preflightLogin.status === 204,
      `Status: ${preflightLogin.status}`
    );
    assert(
      `Access-Control-Allow-Origin matches requesting origin: ${vercelOrigin}`,
      preflightLogin.headers['access-control-allow-origin'] === vercelOrigin,
      `Got: ${preflightLogin.headers['access-control-allow-origin']}`
    );
    assert(
      'Access-Control-Allow-Credentials is true',
      preflightLogin.headers['access-control-allow-credentials'] === 'true'
    );
    assert(
      'Access-Control-Allow-Methods includes POST',
      preflightLogin.headers['access-control-allow-methods']?.includes('POST')
    );
    assert(
      'Access-Control-Max-Age header is present',
      Boolean(preflightLogin.headers['access-control-max-age'])
    );

    // -------------------------------------------------------------------------
    // TEST 2: Health check endpoint from external Render domain
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing /api/health from external Render domain ---');
    const renderOrigin = 'https://friend-resume-client.onrender.com';
    const healthRes = await makeRawRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Origin': renderOrigin
      }
    });

    assert('GET /api/health returns 200 OK', healthRes.status === 200);
    assert(
      `Health check has Access-Control-Allow-Origin: ${renderOrigin}`,
      healthRes.headers['access-control-allow-origin'] === renderOrigin
    );
    assert('Health check reports database status Connected', healthRes.data?.database === 'Connected');
    assert('Health check reports success: true', healthRes.data?.success === true);

    // -------------------------------------------------------------------------
    // TEST 3: External Browser Registration with Credentials
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Cross-Origin User Registration ---');
    const uniqueEmail = `external_user_${Date.now()}@domain.com`;
    const regPayload = {
      fullName: 'External Test User',
      email: uniqueEmail,
      password: 'StrongPassword@2026',
      confirmPassword: 'StrongPassword@2026'
    };

    const regRes = await makeRawRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
          'Origin': renderOrigin,
          'Content-Type': 'application/json'
        }
      },
      regPayload
    );

    assert('POST /api/auth/register returns 201 Created', regRes.status === 201, `Status: ${regRes.status}`);
    assert(
      `Register response reflects Access-Control-Allow-Origin: ${renderOrigin}`,
      regRes.headers['access-control-allow-origin'] === renderOrigin
    );
    assert(
      'Register response has Access-Control-Allow-Credentials: true',
      regRes.headers['access-control-allow-credentials'] === 'true'
    );
    assert(
      'Register returns JWT access token in body',
      Boolean(regRes.data?.data?.token)
    );
    const setCookieHeader = regRes.headers['set-cookie'] || [];
    const refreshCookie = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
    assert(
      'Register sets refreshToken HTTP-Only cookie',
      refreshCookie.includes('refreshToken=') && refreshCookie.toLowerCase().includes('httponly')
    );

    const userToken = regRes.data?.data?.token;

    // -------------------------------------------------------------------------
    // TEST 4: External Browser Login with Credentials
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Cross-Origin User Login ---');
    const loginRes = await makeRawRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Origin': vercelOrigin,
          'Content-Type': 'application/json'
        }
      },
      {
        email: uniqueEmail,
        password: 'StrongPassword@2026'
      }
    );

    assert('POST /api/auth/login returns 200 OK', loginRes.status === 200, `Status: ${loginRes.status}`);
    assert(
      `Login response reflects Access-Control-Allow-Origin: ${vercelOrigin}`,
      loginRes.headers['access-control-allow-origin'] === vercelOrigin
    );
    assert(
      'Login response has Access-Control-Allow-Credentials: true',
      loginRes.headers['access-control-allow-credentials'] === 'true'
    );
    assert(
      'Login returns JWT token and user profile object',
      Boolean(loginRes.data?.data?.token) && loginRes.data?.data?.user?.email === uniqueEmail
    );

    // -------------------------------------------------------------------------
    // TEST 5: Authenticated Cross-Origin API Request (Bearer Token)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Authenticated GET /api/auth/profile with Bearer Token ---');
    const profileRes = await makeRawRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Origin': vercelOrigin,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    assert('GET /api/auth/profile returns 200 OK', profileRes.status === 200);
    assert(
      `Profile response includes CORS origin header: ${vercelOrigin}`,
      profileRes.headers['access-control-allow-origin'] === vercelOrigin
    );
    assert(
      'Profile data matches authenticated user email',
      profileRes.data?.data?.email === uniqueEmail
    );

    // -------------------------------------------------------------------------
    // TEST 6: Cross-Origin Session Refresh with Cookie
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Cross-Origin Session Refresh (POST /api/auth/refresh) ---');
    const rawCookie = Array.isArray(loginRes.headers['set-cookie'])
      ? loginRes.headers['set-cookie'][0].split(';')[0]
      : (loginRes.headers['set-cookie'] || '').split(';')[0];

    const refreshRes = await makeRawRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/refresh',
      method: 'POST',
      headers: {
        'Origin': renderOrigin,
        'Cookie': rawCookie,
        'Content-Type': 'application/json'
      }
    });

    assert('POST /api/auth/refresh returns 200 OK', refreshRes.status === 200, `Status: ${refreshRes.status}`);
    assert(
      `Refresh response includes CORS header: ${renderOrigin}`,
      refreshRes.headers['access-control-allow-origin'] === renderOrigin
    );
    assert(
      'Refresh returns new access token',
      Boolean(refreshRes.data?.data?.token)
    );

    // -------------------------------------------------------------------------
    // TEST 7: Preflight OPTIONS on Uploads and Protected Routes
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Preflight OPTIONS on /api/resumes/upload ---');
    const preflightUpload = await makeRawRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/resumes/upload',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://resume-scanner.netlify.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    assert(
      'OPTIONS /api/resumes/upload returns 204 No Content',
      preflightUpload.status === 204
    );
    assert(
      'Upload preflight allows Netlify origin',
      preflightUpload.headers['access-control-allow-origin'] === 'https://resume-scanner.netlify.app'
    );
    assert(
      'Upload preflight has credentials: true',
      preflightUpload.headers['access-control-allow-credentials'] === 'true'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Verify Wildcard '*' is NEVER returned when credentials are used
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Verifying CORS Spec Compliance (No Wildcard with Credentials) ---');
    for (const origin of EXTERNAL_ORIGINS) {
      const optCheck = await makeRawRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST'
        }
      });
      assert(
        `Origin "${origin}" receives exact reflected origin, NOT wildcard "*"`,
        optCheck.headers['access-control-allow-origin'] === origin &&
        optCheck.headers['access-control-allow-origin'] !== '*'
      );
    }

    console.log('\n======================================================================');
    console.log(`  CORS & CROSS-ORIGIN AUTH TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================================\n');

    if (failed === 0) {
      console.log('🎉 ALL PRODUCTION CORS & AUTHENTICATION FLOW TESTS PASSED WITH 100% SUCCESS!\n');
      process.exit(0);
    } else {
      console.error('💥 SOME TESTS FAILED!\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test suite execution error:', err);
    process.exit(1);
  }
}, 2500);
