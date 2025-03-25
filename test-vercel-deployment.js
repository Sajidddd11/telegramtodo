const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask question and get input
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function testEndpoint(url, endpoint, method = 'GET', body = null, headers = {}) {
  try {
    console.log(`\nTesting ${method} ${url}${endpoint}...`);
    const response = await fetch(`${url}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = responseText;
    }
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    console.log('=== Vercel Deployment Test Tool ===\n');
    
    // Get environment URLs
    const localUrl = 'http://localhost:3000';
    const vercelUrl = await askQuestion('Enter your Vercel URL (e.g., https://your-app.vercel.app): ');
    
    if (!vercelUrl) {
      throw new Error('Vercel URL is required');
    }
    
    // Get credentials
    const username = await askQuestion('Enter your username: ');
    const password = await askQuestion('Enter your password: ');
    
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Test both environments
    const environments = [
      { name: 'Local', url: localUrl },
      { name: 'Vercel', url: vercelUrl }
    ];
    
    for (const env of environments) {
      console.log(`\n=== Testing ${env.name} Environment ===`);
      
      // 1. Test basic connectivity
      await testEndpoint(env.url, '/test');
      
      // 2. Test login
      const loginResult = await testEndpoint(env.url, '/api/auth/login', 'POST', {
        username,
        password
      });
      
      if (!loginResult.success) {
        console.log(`❌ Login failed in ${env.name} environment`);
        continue;
      }
      
      const token = loginResult.data.access_token;
      
      // 3. Test todos endpoints
      console.log('\nTesting Todos API...');
      await testEndpoint(env.url, '/api/todos', 'GET', null, { Authorization: `Bearer ${token}` });
      
      // 4. Test Telegram endpoints
      console.log('\nTesting Telegram API...');
      
      // Check Telegram link status
      await testEndpoint(env.url, '/api/telegram/status', 'GET', null, { Authorization: `Bearer ${token}` });
      
      // Check webhook endpoint
      const webhookResult = await testEndpoint(env.url, '/api/telegram/webhook', 'POST', {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: { id: 123456789, first_name: 'Test User' },
          text: '/test'
        }
      });
      
      // 5. Test Telegram bot initialization
      console.log('\nTesting Telegram Bot Initialization...');
      const botResult = await testEndpoint(env.url, '/api/telegram/debug/123456789', 'GET');
      
      // 6. Check environment variables
      console.log('\nChecking Environment Variables...');
      const envResult = await testEndpoint(env.url, '/');
      console.log('Environment Info:', envResult.data);
    }
    
    console.log('\n=== Test Summary ===');
    console.log('1. Check the responses above for any errors or differences between local and Vercel');
    console.log('2. Pay special attention to the Telegram webhook response');
    console.log('3. Verify that the bot token is properly set in both environments');
    console.log('4. Check if the webhook URL is correctly configured in Telegram');
    
  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 