/**
 * Live Google Apps Script Deployment Verification Test
 * Run this script with: node test_live_backend.js
 */

const https = require('https');

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxj-gpHSwq4FCrxQoJX5CYWMArau2KgTI9pk2rJRoW7Ty3VTDCZpYVdQuJFY7bi9Ezgvw/exec';

function sendGasRequest(method, payload = null, queryParam = '') {
  return new Promise((resolve, reject) => {
    const fullUrl = queryParam ? `${GAS_URL}?${queryParam}` : GAS_URL;
    const bodyData = payload ? JSON.stringify(payload) : null;

    function execute(url) {
      const isPost = method === 'POST';
      const options = {
        method: isPost ? 'POST' : 'GET',
        headers: isPost ? {
          'Content-Type': 'text/plain;charset=utf-8',
          'Content-Length': Buffer.byteLength(bodyData)
        } : {}
      };

      const req = https.request(url, options, (res) => {
        // Google Apps Script redirect handling (HTTP 302 -> Google usercontent URL)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          https.get(res.headers.location, (redRes) => {
            let data = '';
            redRes.on('data', chunk => data += chunk);
            redRes.on('end', () => {
              try { resolve(JSON.parse(data)); }
              catch(e) { resolve({ raw: data, status: redRes.statusCode }); }
            });
          }).on('error', reject);
          return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { resolve({ raw: data, status: res.statusCode }); }
        });
      });

      req.on('error', reject);
      if (bodyData) req.write(bodyData);
      req.end();
    }

    execute(fullUrl);
  });
}

async function runLiveVerification() {
  console.log('===========================================================');
  console.log('  BioPC ApexExam - Live Google Apps Script Deployment Test ');
  console.log('===========================================================');
  console.log(`Target URL: ${GAS_URL}\n`);

  // TEST 1: Ping connectivity
  process.stdout.write('[TEST 1] Testing Web App Ping & Connectivity... ');
  try {
    const pingRes = await sendGasRequest('GET', null, 'action=ping');
    if (pingRes && pingRes.success) {
      console.log('PASSED (Server is Online)');
    } else {
      console.log('FAILED:', JSON.stringify(pingRes));
    }
  } catch(err) {
    console.log('FAILED (Network error):', err.message);
  }

  // TEST 2: Read exam status (doGet non-blocking read)
  process.stdout.write('[TEST 2] Testing Exam Status Read (doGet)... ');
  try {
    const statusRes = await sendGasRequest('GET', null, 'action=getExamStatus');
    if (statusRes && statusRes.success) {
      console.log(`PASSED (Current Status: ${statusRes.examStatus}, Duration: ${statusRes.examDurationMinutes}m)`);
    } else {
      console.log('FAILED:', JSON.stringify(statusRes));
    }
  } catch(err) {
    console.log('FAILED:', err.message);
  }

  // TEST 3: Check if NEW Code.gs is deployed (deduplicateSubmissions action)
  process.stdout.write('[TEST 3] Checking if NEW Code.gs is Deployed... ');
  try {
    const dedupRes = await sendGasRequest('POST', { action: 'deduplicateSubmissions', adminKey: 'admin123' });
    if (dedupRes && dedupRes.message === 'Unknown action') {
      console.log('FAILED (OLD CODE DETECTED)');
      console.log('\n-----------------------------------------------------------');
      console.log('  ATTENTION: YOUR GOOGLE APPS SCRIPT IS STILL RUNNING THE OLD CODE.GS!');
      console.log('  Please complete the update steps below:');
      console.log('  1. Open your Google Sheet > Extensions > Apps Script.');
      console.log('  2. Paste the updated Code.gs.');
      console.log('  3. Click Save (Ctrl+S).');
      console.log('  4. Click Deploy > Manage Deployments.');
      console.log('  5. Click Edit (Pencil) > Version: New Version > Deploy.');
      console.log('-----------------------------------------------------------\n');
    } else if (dedupRes && dedupRes.success) {
      console.log('PASSED (NEW CODE.GS IS ACTIVE!)');
      console.log(`         Server message: ${dedupRes.message}`);
    } else {
      console.log('RESPONSE:', JSON.stringify(dedupRes));
    }
  } catch(err) {
    console.log('FAILED:', err.message);
  }

  // TEST 4: Leaderboard retrieval
  process.stdout.write('[TEST 4] Testing Leaderboard Data Retrieval... ');
  try {
    const leadRes = await sendGasRequest('GET', null, 'action=getLeaderboard');
    if (leadRes && leadRes.success) {
      const count = leadRes.leaderboard ? leadRes.leaderboard.length : 0;
      console.log(`PASSED (${count} recorded candidate submissions found)`);
    } else {
      console.log('FAILED:', JSON.stringify(leadRes));
    }
  } catch(err) {
    console.log('FAILED:', err.message);
  }

  console.log('\n===========================================================');
  console.log('Verification finished. Re-run anytime with: node test_live_backend.js');
  console.log('===========================================================');
}

runLiveVerification();
