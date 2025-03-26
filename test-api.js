const fetch = require('node-fetch');

const ngrokUrl = 'https://8298-103-145-119-103.ngrok-free.app';

async function testApi() {
  try {
    console.log('Testing API connection to:', ngrokUrl);
    
    // Test basic health endpoint
    console.log('\nTesting / endpoint:');
    const healthResponse = await fetch(`${ngrokUrl}/`);
    const healthData = await healthResponse.json();
    console.log('Status:', healthResponse.status);
    console.log('Response:', healthData);
    
    // Test /test endpoint
    console.log('\nTesting /test endpoint:');
    const testResponse = await fetch(`${ngrokUrl}/test`);
    const testData = await testResponse.json();
    console.log('Status:', testResponse.status);
    console.log('Response:', testData);
    
    // Test CORS headers
    console.log('\nChecking CORS headers:');
    const corsResponse = await fetch(`${ngrokUrl}/test`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('Status:', corsResponse.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    });
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testApi(); 