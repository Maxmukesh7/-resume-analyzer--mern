import http from 'http';
import app from './server.js';

// Wait for server to start
setTimeout(async () => {
  const port = process.env.PORT || 5000;
  console.log(`\n🧪 Testing Production Single-Service Routes on http://localhost:${port}...\n`);

  async function checkEndpoint(path, expectedStatus, expectedType, isHtmlCheck = false) {
    return new Promise((resolve) => {
      http.get(`http://localhost:${port}${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const contentType = res.headers['content-type'] || '';
          const statusOk = res.statusCode === expectedStatus;
          const typeOk = contentType.includes(expectedType);
          const htmlHasVite = isHtmlCheck ? (data.includes('<!DOCTYPE html>') || data.includes('html')) : true;

          if (statusOk && typeOk && htmlHasVite) {
            console.log(`  ✅ [PASS] ${path.padEnd(28)} -> Status: ${res.statusCode}, Content-Type: ${expectedType}`);
            resolve(true);
          } else {
            console.error(`  ❌ [FAIL] ${path.padEnd(28)} -> Status: ${res.statusCode} (expected ${expectedStatus}), Content-Type: ${contentType} (expected ${expectedType})`);
            resolve(false);
          }
        });
      }).on('error', (err) => {
        console.error(`  ❌ [ERROR] ${path.padEnd(28)} ->`, err.message);
        resolve(false);
      });
    });
  }

  const routesToTest = [
    { path: '/api/health', status: 200, type: 'application/json', isHtml: false },
    { path: '/api/nonexistent-route', status: 404, type: 'application/json', isHtml: false },
    { path: '/', status: 200, type: 'text/html', isHtml: true },
    { path: '/login', status: 200, type: 'text/html', isHtml: true },
    { path: '/register', status: 200, type: 'text/html', isHtml: true },
    { path: '/dashboard', status: 200, type: 'text/html', isHtml: true },
    { path: '/upload', status: 200, type: 'text/html', isHtml: true },
    { path: '/ats', status: 200, type: 'text/html', isHtml: true },
    { path: '/ai-insights', status: 200, type: 'text/html', isHtml: true },
    { path: '/ai-improvement', status: 200, type: 'text/html', isHtml: true },
    { path: '/job-match', status: 200, type: 'text/html', isHtml: true },
    { path: '/candidate-ranking', status: 200, type: 'text/html', isHtml: true },
    { path: '/profile', status: 200, type: 'text/html', isHtml: true },
    { path: '/settings', status: 200, type: 'text/html', isHtml: true },
    { path: '/dashboard/upload', status: 200, type: 'text/html', isHtml: true },
    { path: '/dashboard/report/test-id-123', status: 200, type: 'text/html', isHtml: true },
    { path: '/admin/resumes', status: 200, type: 'text/html', isHtml: true },
  ];

  let passed = true;
  for (const r of routesToTest) {
    const res = await checkEndpoint(r.path, r.status, r.type, r.isHtml);
    if (!res) passed = false;
  }

  if (passed) {
    console.log('\n🎉 ALL PRODUCTION SINGLE-SERVICE ROUTES & SPA FALLBACKS VERIFIED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('\n💥 SOME ROUTING CHECKS FAILED!\n');
    process.exit(1);
  }
}, 3000);
