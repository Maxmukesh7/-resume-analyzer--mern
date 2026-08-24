import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000';

async function runDeleteResumesTests() {
  console.log('🧪 Starting Delete All & Bulk Delete Resumes Automated Test Suite...\n');
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
    fullName: `Delete Tester ${timestamp}`,
    email: `delete_tester_${timestamp}@example.com`,
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
    userId = regData.data.user?.id || regData.data.user?._id;
  } catch (err) {
    console.error('Registration failed:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  // Helper to upload a sample resume file
  const uploadMockResume = async (fileName, fileContent) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="resume"; filename="${fileName}"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;
    body += fileContent;
    body += `\r\n--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/api/resumes/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: Buffer.from(body)
    });
    return await res.json();
  };

  // 2. Upload 3 sample resumes
  console.log('\n📤 Uploading 3 test resumes...');
  const res1 = await uploadMockResume('Sample_Resume_1.pdf', 'John Doe\nSoftware Engineer\nReact Node.js Python SQL');
  const res2 = await uploadMockResume('Sample_Resume_2.pdf', 'Jane Smith\nDevOps Engineer\nAWS Docker Kubernetes CI/CD');
  const res3 = await uploadMockResume('Sample_Resume_3.pdf', 'Alex Taylor\nFrontend Developer\nHTML CSS JavaScript Vue');

  const id1 = res1.data?._id || res1.data?.id;
  const id2 = res2.data?._id || res2.data?.id;
  const id3 = res3.data?._id || res3.data?.id;

  assert(id1 && id2 && id3, 'Uploaded 3 test resumes successfully');

  // 3. Verify getResumes returns all 3
  const getRes = await fetch(`${BASE_URL}/api/resumes`, { headers: authHeaders });
  const getData = await getRes.json();
  assert(getData.data && getData.data.length === 3, `GET /api/resumes returned 3 resumes (got ${getData.data?.length})`);

  // 4. Test Bulk Delete with 1 ID (id1)
  console.log('\n🗑️ Testing Bulk Delete (delete 1 of 3 resumes)...');
  const bulkDeleteRes = await fetch(`${BASE_URL}/api/resumes/bulk`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: [id1] })
  });
  const bulkDeleteData = await bulkDeleteRes.json();
  assert(bulkDeleteRes.status === 200 && bulkDeleteData.data?.count === 1, 'DELETE /api/resumes/bulk removed selected resume');

  // Verify remaining count is 2
  const getAfterBulk = await fetch(`${BASE_URL}/api/resumes`, { headers: authHeaders });
  const getAfterBulkData = await getAfterBulk.json();
  assert(getAfterBulkData.data && getAfterBulkData.data.length === 2, '2 resumes remaining after bulk delete');

  // 5. Test Delete All Resumes
  console.log('\n🧹 Testing Delete All Resumes (DELETE /api/resumes/all)...');
  const deleteAllRes = await fetch(`${BASE_URL}/api/resumes/all`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const deleteAllData = await deleteAllRes.json();
  assert(deleteAllRes.status === 200 && deleteAllData.data?.count === 2, 'DELETE /api/resumes/all succeeded and returned count 2');

  // 6. Verify GET /api/resumes is empty
  const getAfterDeleteAll = await fetch(`${BASE_URL}/api/resumes`, { headers: authHeaders });
  const getAfterDeleteAllData = await getAfterDeleteAll.json();
  assert(getAfterDeleteAllData.data && getAfterDeleteAllData.data.length === 0, 'GET /api/resumes is now empty ([])');

  // 7. Verify Dashboard Stats
  const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders });
  const statsData = await statsRes.json();
  assert(statsData.data?.totalUploads === 0, 'Dashboard stats show 0 total uploads');

  // 8. Test Delete All when already empty
  const deleteEmptyRes = await fetch(`${BASE_URL}/api/resumes/all`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const deleteEmptyData = await deleteEmptyRes.json();
  assert(deleteEmptyRes.status === 200 && deleteEmptyData.data?.count === 0, 'DELETE /api/resumes/all on empty list returns success with count 0');

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passedCount}/${totalTests} tests passed.`);
  console.log(`========================================\n`);

  if (passedCount === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runDeleteResumesTests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
