// Script to link Telegram account to user account
const fetch = require('node-fetch'); // You might need to install this with: npm install node-fetch

// User credentials and Telegram token
const username = "sajid1";
const password = "00888246";
const telegramToken = "615218";

// API base URL (adjust if needed)
const API_BASE_URL = "https://todobackend-seven.vercel.app";  // or "http://localhost:3000" if running locally

async function linkTelegramAccount() {
  try {
    console.log('Attempting to log in...');
    // Step 1: Log in to get access token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed with status ${loginResponse.status}: ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    
    if (!loginData.access_token) {
      throw new Error('Login failed: No access token returned');
    }
    
    console.log('Login successful! Received access token.');
    console.log(`User ID: ${loginData.user.id}`);
    console.log(`Username: ${loginData.user.username}`);
    
    // Step 2: Link Telegram account using the token
    console.log('Attempting to link Telegram account...');
    const linkResponse = await fetch(`${API_BASE_URL}/telegram/link`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({ token: telegramToken })
    });
    
    if (!linkResponse.ok) {
      const errorText = await linkResponse.text();
      throw new Error(`Linking failed with status ${linkResponse.status}: ${errorText}`);
    }
    
    const linkData = await linkResponse.json();
    console.log('Linking result:', linkData);
    
    if (linkData.success) {
      console.log('Account successfully linked to Telegram!');
    } else {
      console.log('Linking failed:', linkData.error || 'Unknown error');
    }
    
    return linkData;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Execute the function
linkTelegramAccount()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error)); 