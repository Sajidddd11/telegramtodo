const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test URLs
const LOCAL_URL = 'http://localhost:3000';
const NGROK_URL = 'https://8298-103-145-119-103.ngrok-free.app';

// Helper to make authenticated requests
async function makeAuthenticatedRequest(baseUrl, endpoint, token, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Making ${method} request to ${baseUrl}${endpoint}`);
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = responseText;
    }
    
    return {
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    console.error(`Error making request to ${baseUrl}${endpoint}:`, error.message);
    return { error: error.message };
  }
}

// Main function to test JWT with different domains
async function testJwtAcrossDomains() {
  try {
    console.log('=== JWT Cross-Domain Test ===\n');
    
    // Get credentials
    const username = await askQuestion('Enter your username: ');
    const password = await askQuestion('Enter your password: ');
    
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Step 1: Login with local URL
    console.log('\n--- Step 1: Login with Local URL ---');
    const localLoginResult = await fetch(`${LOCAL_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const localLoginData = await localLoginResult.json();
    console.log('Local login status:', localLoginResult.status);
    
    if (!localLoginData.access_token) {
      throw new Error('Failed to login with local URL');
    }
    
    const localToken = localLoginData.access_token;
    console.log('Local token (first 20 chars):', localToken.substring(0, 20) + '...');
    
    // Step 2: Test with local token against local endpoint
    console.log('\n--- Step 2: Using Local Token with Local API ---');
    const localTodosWithLocalToken = await makeAuthenticatedRequest(
      LOCAL_URL, 
      '/api/todos', 
      localToken
    );
    console.log('Status:', localTodosWithLocalToken.status);
    console.log('Todos count:', Array.isArray(localTodosWithLocalToken.data) ? 
      localTodosWithLocalToken.data.length : 'N/A');
    
    // Step 3: Test with local token against ngrok endpoint
    console.log('\n--- Step 3: Using Local Token with Ngrok API ---');
    const ngrokTodosWithLocalToken = await makeAuthenticatedRequest(
      NGROK_URL, 
      '/api/todos', 
      localToken
    );
    console.log('Status:', ngrokTodosWithLocalToken.status);
    console.log('Todos count:', Array.isArray(ngrokTodosWithLocalToken.data) ? 
      ngrokTodosWithLocalToken.data.length : 'N/A');
    console.log('Response:', ngrokTodosWithLocalToken.data);
    
    // Step 4: Login with ngrok URL
    console.log('\n--- Step 4: Login with Ngrok URL ---');
    const ngrokLoginResult = await fetch(`${NGROK_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const ngrokLoginData = await ngrokLoginResult.json();
    console.log('Ngrok login status:', ngrokLoginResult.status);
    
    if (!ngrokLoginData.access_token) {
      throw new Error('Failed to login with ngrok URL');
    }
    
    const ngrokToken = ngrokLoginData.access_token;
    console.log('Ngrok token (first 20 chars):', ngrokToken.substring(0, 20) + '...');
    
    // Step 5: Test with ngrok token against local endpoint
    console.log('\n--- Step 5: Using Ngrok Token with Local API ---');
    const localTodosWithNgrokToken = await makeAuthenticatedRequest(
      LOCAL_URL, 
      '/api/todos', 
      ngrokToken
    );
    console.log('Status:', localTodosWithNgrokToken.status);
    console.log('Todos count:', Array.isArray(localTodosWithNgrokToken.data) ? 
      localTodosWithNgrokToken.data.length : 'N/A');
    
    // Step 6: Test with ngrok token against ngrok endpoint
    console.log('\n--- Step 6: Using Ngrok Token with Ngrok API ---');
    const ngrokTodosWithNgrokToken = await makeAuthenticatedRequest(
      NGROK_URL, 
      '/api/todos', 
      ngrokToken
    );
    console.log('Status:', ngrokTodosWithNgrokToken.status);
    console.log('Todos count:', Array.isArray(ngrokTodosWithNgrokToken.data) ? 
      ngrokTodosWithNgrokToken.data.length : 'N/A');
    
    // Summary
    console.log('\n=== Summary ===');
    console.log('1. Local token with local API:', localTodosWithLocalToken.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('2. Local token with ngrok API:', ngrokTodosWithLocalToken.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('3. Ngrok token with local API:', localTodosWithNgrokToken.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('4. Ngrok token with ngrok API:', ngrokTodosWithNgrokToken.status === 200 ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

// Helper function to ask questions
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Run the test
testJwtAcrossDomains(); 