import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000';

async function runAvatarTests() {
  console.log('🧪 Starting Profile Picture Upload Automated Test Suite...\n');
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // Generate test user credentials
  const timestamp = Date.now();
  const testUser = {
    fullName: `Avatar Tester ${timestamp}`,
    email: `avatar_tester_${timestamp}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let token = '';
  let userId = '';

  // 1. Register test user
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.data?.token, 'Register test user');
    token = regData.data.token;
    userId = regData.data.user.id || regData.data.user._id;
  } catch (err) {
    console.error('Registration failed:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  // 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  let firstAvatarPath = '';

  // Test 1: Upload Valid PNG Avatar
  try {
    const formData = new FormData();
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('avatar', pngBlob, 'avatar.png');

    const uploadRes = await fetch(`${BASE_URL}/api/auth/profile/avatar`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const uploadData = await uploadRes.json();

    assert(uploadRes.status === 200, 'Upload valid PNG avatar (HTTP 200)');
    assert(uploadData.data?.avatar && uploadData.data.avatar.startsWith('/uploads/avatars/'), 'Avatar path stored in MongoDB user record');
    firstAvatarPath = uploadData.data.avatar;

    // Verify physical file exists on disk
    const diskPath = path.join(__dirname, firstAvatarPath);
    assert(fs.existsSync(diskPath), `Avatar file saved to disk at: ${firstAvatarPath}`);

    // Verify static access
    const staticRes = await fetch(`${BASE_URL}${firstAvatarPath}`);
    assert(staticRes.status === 200, 'Static URL serving avatar file (HTTP 200)');
  } catch (err) {
    console.error('Upload valid PNG failed:', err.message);
    assert(false, 'Upload valid PNG avatar');
  }

  // Test 2: Upload Valid JPG Avatar & Verify Old Avatar Cleanup
  try {
    const formData = new FormData();
    const jpgBlob = new Blob([pngBuffer], { type: 'image/jpeg' });
    formData.append('avatar', jpgBlob, 'avatar2.jpg');

    const uploadRes2 = await fetch(`${BASE_URL}/api/auth/profile/avatar`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const uploadData2 = await uploadRes2.json();

    assert(uploadRes2.status === 200, 'Upload second JPG avatar (HTTP 200)');
    const secondAvatarPath = uploadData2.data?.avatar;
    assert(secondAvatarPath !== firstAvatarPath, 'Avatar path updated to new file');

    // Verify old file was deleted from disk
    const oldDiskPath = path.join(__dirname, firstAvatarPath);
    assert(!fs.existsSync(oldDiskPath), 'Previous avatar file cleaned up from server disk');

    const newDiskPath = path.join(__dirname, secondAvatarPath);
    assert(fs.existsSync(newDiskPath), 'New avatar file exists on server disk');
  } catch (err) {
    console.error('Upload second avatar failed:', err.message);
    assert(false, 'Upload second avatar');
  }

  // Test 3: Profile Persistence across GET /api/auth/profile
  try {
    const profRes = await fetch(`${BASE_URL}/api/auth/profile`, { headers: authHeaders });
    const profData = await profRes.json();
    assert(profRes.status === 200 && profData.data?.avatar?.startsWith('/uploads/avatars/'), 'Profile avatar persists on GET /api/auth/profile');
  } catch (err) {
    assert(false, 'Profile persistence test');
  }

  // Test 4: Profile Persistence across Login
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.data?.user?.avatar?.startsWith('/uploads/avatars/'), 'Profile avatar persists across login/logout session');
  } catch (err) {
    assert(false, 'Login persistence test');
  }

  // Test 5: Reject Invalid File Format (.txt)
  try {
    const formData = new FormData();
    const txtBlob = new Blob(['This is plain text'], { type: 'text/plain' });
    formData.append('avatar', txtBlob, 'document.txt');

    const res = await fetch(`${BASE_URL}/api/auth/profile/avatar`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    assert(res.status === 400, 'Reject invalid file type (.txt) with 400 Bad Request');
  } catch (err) {
    assert(false, 'Reject invalid file type (.txt)');
  }

  // Test 6: Reject Oversized File (> 5MB)
  try {
    const formData = new FormData();
    const largeBlob = new Blob([Buffer.alloc(5.5 * 1024 * 1024, 0)], { type: 'image/png' });
    formData.append('avatar', largeBlob, 'large_image.png');

    const res = await fetch(`${BASE_URL}/api/auth/profile/avatar`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    assert(res.status === 400, 'Reject oversized file (>5MB) with 400 Bad Request');
  } catch (err) {
    assert(false, 'Reject oversized file (>5MB)');
  }

  // Test 7: Unauthorized Request (No Token)
  try {
    const formData = new FormData();
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('avatar', pngBlob, 'avatar.png');

    const res = await fetch(`${BASE_URL}/api/auth/profile/avatar`, {
      method: 'POST',
      body: formData
    });
    assert(res.status === 401, 'Reject unauthenticated upload with 401 Unauthorized');
  } catch (err) {
    assert(false, 'Reject unauthenticated upload');
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passedCount}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedCount === totalTests) {
    console.log('🎉 ALL PROFILE PICTURE UPLOAD TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('⚠️ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

runAvatarTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
