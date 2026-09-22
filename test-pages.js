const http = require('http');

async function testPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`[PASS] ${url} (Status: ${res.statusCode})`);
          resolve({ url, status: res.statusCode, ok: true, data });
        } else {
          console.error(`[FAIL] ${url} (Status: ${res.statusCode})`);
          resolve({ url, status: res.statusCode, ok: false, data });
        }
      });
    }).on('error', (err) => {
      console.error(`[ERROR] ${url} - ${err.message}`);
      resolve({ url, error: err.message, ok: false });
    });
  });
}

async function runTests() {
  console.log('Testing Core Pages...');
  
  // Test basic pages
  await testPage('http://localhost:3000/');
  await testPage('http://localhost:3000/cases');
  
  // Get cases to test dynamic routes
  const casesRes = await testPage('http://localhost:3000/api/cases');
  let caseId = null;
  
  if (casesRes.ok && casesRes.data) {
    try {
      const parsed = JSON.parse(casesRes.data);
      if (parsed.success && parsed.data.length > 0) {
        caseId = parsed.data[0].id;
        console.log(`\nFound Case ID: ${caseId}. Testing dynamic routes...`);
      } else {
        console.log('\nNo cases found to test dynamic routes. Skipping.');
      }
    } catch (e) {
      console.log('Error parsing cases response:', e.message);
    }
  }

  if (caseId) {
    await testPage(`http://localhost:3000/cases/${caseId}`);
    await testPage(`http://localhost:3000/cases/${caseId}/evidence`);
    await testPage(`http://localhost:3000/cases/${caseId}/graph`);
    await testPage(`http://localhost:3000/cases/${caseId}/investigation`);
    await testPage(`http://localhost:3000/cases/${caseId}/reports`);
    
    // Check if there is evidence
    const evRes = await testPage(`http://localhost:3000/api/cases/${caseId}`);
    if (evRes.ok && evRes.data) {
      try {
         const p = JSON.parse(evRes.data);
         if (p.success && p.data && p.data.evidenceFiles && p.data.evidenceFiles.length > 0) {
             const evId = p.data.evidenceFiles[0].id;
             console.log(`\nFound Evidence ID: ${evId}. Testing evidence detail...`);
             await testPage(`http://localhost:3000/cases/${caseId}/evidence/${evId}`);
         }
      } catch(e) {}
    }
  }
  
  console.log('\nTests completed.');
}

runTests();
