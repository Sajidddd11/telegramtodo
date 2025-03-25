const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function testEndpoint(url, endpoint, method = 'GET', headers = {}) {
  try {
    console.log(`\nTesting ${endpoint}...`);
    const response = await fetch(`${url}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return { success: response.ok, data };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    console.log('=== Vercel Deployment Test Tool ===\n');
    
    // Get Vercel URL
    const vercelUrl = await askQuestion('Enter your Vercel URL (e.g., https://your-app.vercel.app): ');
    if (!vercelUrl) {
      throw new Error('Vercel URL is required');
    }

    // 1. Test basic API endpoints
    console.log('\n=== Testing Basic API Endpoints ===');
    await testEndpoint(vercelUrl, '/');
    await testEndpoint(vercelUrl, '/test');

    // 2. Test Telegram webhook endpoint
    console.log('\n=== Testing Telegram Webhook ===');
    const webhookTest = await testEndpoint(vercelUrl, '/api/telegram/webhook', 'POST', {
      'Content-Type': 'application/json'
    });

    // 3. Test Telegram debug endpoint
    console.log('\n=== Testing Telegram Debug Endpoint ===');
    const chatId = await askQuestion('Enter a Telegram chat ID to test (or press Enter to skip): ');
    if (chatId) {
      await testEndpoint(vercelUrl, `/api/telegram/debug/${chatId}`);
    }

    // 4. Test Telegram status endpoint (requires authentication)
    console.log('\n=== Testing Telegram Status (Requires Authentication) ===');
    const token = await askQuestion('Enter your JWT token (or press Enter to skip): ');
    if (token) {
      await testEndpoint(vercelUrl, '/api/telegram/status', 'GET', {
        'Authorization': `Bearer ${token}`
      });
    }

    // 5. Test Telegram link endpoint (requires authentication)
    if (token) {
      console.log('\n=== Testing Telegram Link Endpoint ===');
      const linkToken = await askQuestion('Enter a Telegram link token (or press Enter to skip): ');
      if (linkToken) {
        await testEndpoint(vercelUrl, '/api/telegram/link', 'POST', {
          'Authorization': `Bearer ${token}`
        }, { token: linkToken });
      }
    }

    // 6. Test Telegram unlink endpoint (requires authentication)
    if (token) {
      console.log('\n=== Testing Telegram Unlink Endpoint ===');
      const confirm = await askQuestion('Test unlink endpoint? (y/n): ');
      if (confirm.toLowerCase() === 'y') {
        await testEndpoint(vercelUrl, '/api/telegram/unlink', 'POST', {
          'Authorization': `Bearer ${token}`
        });
      }
    }

    // 7. Test Telegram list-users endpoint (for debugging)
    console.log('\n=== Testing Telegram List Users (Debug) ===');
    await testEndpoint(vercelUrl, '/api/telegram/list-users');

    console.log('\n=== Test Complete ===');
    console.log('Please check the responses above for any errors or issues.');
    console.log('Common issues to look for:');
    console.log('1. 404 errors - Endpoint not found');
    console.log('2. 401 errors - Authentication issues');
    console.log('3. 500 errors - Server errors');
    console.log('4. Missing or incorrect environment variables');

  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

main(); 