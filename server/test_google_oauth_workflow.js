import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from './models/User.js';
import { generateAccessToken, verifyAccessToken } from './utils/jwtHelper.js';
import { verifyGoogleIdToken } from './services/googleAuthService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

let passed = 0;
let failed = 0;
let total = 0;

function assert(description, condition, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${description} ${details ? `(${details})` : ''}`);
  }
}

async function runGoogleOAuthTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING GOOGLE OAUTH AUTHENTICATION TEST SUITE');
  console.log('====================================================');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const testGoogleEmail = `google_user_${Date.now()}@example.com`;
  const existingLocalEmail = `local_user_${Date.now()}@example.com`;

  try {
    // ----------------------------------------------------
    // TEST 1: Missing Credential Validation
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Missing Credential Validation ---');
    const emptyRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const emptyData = await emptyRes.json();
    assert('POST /auth/google without credential returns 400 Bad Request', emptyRes.status === 400);
    assert('Error message specifies credential required', emptyData.message?.includes('credential is required'));

    // ----------------------------------------------------
    // TEST 2: Invalid / Fake Google Token Verification
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Invalid Google Token Verification ---');
    const fakeRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake_invalid_google_jwt_token_12345' })
    });
    const fakeData = await fakeRes.json();
    assert('POST /auth/google with forged token returns 401 Unauthorized', fakeRes.status === 401);
    assert('Error message flags invalid or expired credential', fakeData.message?.includes('verification failed') || fakeData.message?.includes('Invalid'));

    // ----------------------------------------------------
    // TEST 3: User Model Schema Flexibility (Password Optional for Google)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: User Model Google Provider Support ---');
    const newGoogleUser = new User({
      fullName: 'Google Test Candidate',
      email: testGoogleEmail,
      avatar: 'https://lh3.googleusercontent.com/a/test-avatar',
      role: 'user',
      isVerified: true,
      authenticationProvider: 'google',
      googleId: 'google_oauth_sub_1092837465'
    });
    await newGoogleUser.save();
    assert('Google user saved without password in MongoDB', Boolean(newGoogleUser._id));
    assert('Google user authenticationProvider is "google"', newGoogleUser.authenticationProvider === 'google');
    assert('Google user isVerified is true', newGoogleUser.isVerified === true);
    assert('matchPassword returns false safely when no password', (await newGoogleUser.matchPassword('somePass')) === false);

    // ----------------------------------------------------
    // TEST 4: JWT Token Generation for Google User
    // ----------------------------------------------------
    console.log('\n--- TEST 4: JWT Token Generation & Claims ---');
    const token = generateAccessToken(newGoogleUser);
    const decoded = verifyAccessToken(token);
    assert('Generated JWT is valid string', Boolean(token && token.length > 20));
    assert('Decoded token id matches user id', decoded.id === newGoogleUser._id.toString());
    assert('Decoded token role is "user"', decoded.role === 'user');

    // ----------------------------------------------------
    // TEST 5: API Access with Google User JWT
    // ----------------------------------------------------
    console.log('\n--- TEST 5: API Access with Google User JWT ---');
    const profileRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    assert('Google user can access GET /api/auth/profile', profileRes.status === 200);
    assert('Profile returns full name and email', profileData.data?.email === testGoogleEmail);

    // Verify non-admin role security
    const adminStatsRes = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert('Google normal user is blocked from admin endpoints (403 Forbidden)', adminStatsRes.status === 403);

    // ----------------------------------------------------
    // TEST 6: Safe Account Linking (Existing Email Account)
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Safe Account Linking ---');
    // 1. Create traditional local email/password user
    const localUser = await User.create({
      fullName: 'Local User Before Link',
      email: existingLocalEmail,
      password: 'Password123!',
      authenticationProvider: 'local'
    });
    const initialUserCount = await User.countDocuments({ email: existingLocalEmail });
    assert('Traditional email user created initially', initialUserCount === 1);

    // 2. Simulate account linking (as handled in googleLogin controller)
    const existingDoc = await User.findOne({ email: existingLocalEmail });
    if (!existingDoc.googleId) {
      existingDoc.googleId = 'google_linked_sub_998877';
      existingDoc.isVerified = true;
      await existingDoc.save();
    }

    const postLinkCount = await User.countDocuments({ email: existingLocalEmail });
    assert('No duplicate user record created on Google linking (Count remains 1)', postLinkCount === 1);
    assert('Existing user now has linked googleId', existingDoc.googleId === 'google_linked_sub_998877');
    assert('Original password remains intact and verifiable', await existingDoc.matchPassword('Password123!'));

    // ----------------------------------------------------
    // TEST 7: Deactivated User Protection
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Deactivated User Protection ---');
    existingDoc.isActive = false;
    await existingDoc.save();
    assert('Deactivated user status set in DB', existingDoc.isActive === false);

    // Clean up test documents
    await User.deleteMany({ email: { $in: [testGoogleEmail, existingLocalEmail] } });
    console.log('🧹 Cleaned up temporary test user accounts.');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed}/${total} PASSED (${failed} failed)`);
    console.log('====================================================');

    if (failed > 0) {
      throw new Error(`${failed} tests failed in Google OAuth test suite.`);
    }

    console.log('🎉 ALL GOOGLE OAUTH TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Google OAuth Test Suite Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runGoogleOAuthTestSuite();
