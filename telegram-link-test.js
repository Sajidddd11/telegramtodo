// Interactive script for testing Telegram integration
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

async function main() {
  try {
    console.log('=== Telegram Integration Test Tool ===\n');
    
    // Get API URL
    const defaultUrl = 'http://localhost:3000';
    const apiBaseUrl = await askQuestion(`Enter API base URL [${defaultUrl}]: `) || defaultUrl;
    
    // Test basic connectivity first
    console.log(`\nTesting connectivity to ${apiBaseUrl}...`);
    try {
      const testResponse = await fetch(`${apiBaseUrl}/test`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`✅ Server is responsive! Environment: ${testData.env}, Time: ${testData.timestamp}`);
      } else {
        console.log(`⚠️ Server responded with status: ${testResponse.status}`);
      }
    } catch (error) {
      console.error(`❌ Connection error: ${error.message}`);
      console.log('Continuing anyway, but you may experience issues...');
    }
    
    // Get credentials
    const username = await askQuestion('Enter your username: ');
    const password = await askQuestion('Enter your password: ');
    
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    console.log('\nAttempting to log in...');
    const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed (${loginResponse.status}): ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log(`Login successful! User: ${loginData.user.username}`);
    
    // Main menu
    while (true) {
      console.log('\n=== Telegram Integration Menu ===');
      console.log('1. Check linking status');
      console.log('2. Link Telegram account');
      console.log('3. Unlink Telegram account');
      console.log('4. List todos (via API)');
      console.log('5. Test AI Natural Language Processing');
      console.log('6. Exit');
      
      const choice = await askQuestion('\nEnter your choice (1-6): ');
      
      switch (choice) {
        case '1': // Check status
          await checkStatus(apiBaseUrl, loginData.access_token);
          break;
        case '2': // Link account
          await linkAccount(apiBaseUrl, loginData.access_token);
          break;
        case '3': // Unlink account
          await unlinkAccount(apiBaseUrl, loginData.access_token);
          break;
        case '4': // List todos
          await listTodos(apiBaseUrl, loginData.access_token);
          break;
        case '5': // Test AI Natural Language Processing
          await testAiMode(apiBaseUrl, loginData.access_token);
          break;
        case '6': // Exit
          console.log('Goodbye!');
          rl.close();
          return;
        default:
          console.log('Invalid choice. Please try again.');
      }
    }
  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

async function checkStatus(apiBaseUrl, token) {
  try {
    console.log('\nChecking Telegram link status...');
    const response = await fetch(`${apiBaseUrl}/api/telegram/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check failed (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('\nStatus:', data);
    
    if (data.linked) {
      console.log('✅ Your account is linked to Telegram!');
      if (data.linkInfo && data.linkInfo.chatId) {
        console.log(`Chat ID: ${data.linkInfo.chatId}`);
        console.log(`Linked at: ${new Date(data.linkInfo.linkedAt).toLocaleString()}`);
      } else if (data.chatId) {
        console.log(`Chat ID: ${data.chatId}`);
      }
    } else {
      console.log('❌ Your account is not linked to Telegram.');
    }
  } catch (error) {
    console.error('Status check error:', error.message);
  }
}

async function linkAccount(apiBaseUrl, token) {
  try {
    console.log('\n=== Link Telegram Account ===');
    console.log('1. Open your Telegram app and message your bot');
    console.log('2. Send the /start command to the bot');
    console.log('3. The bot will give you a linking code');
    
    const linkToken = await askQuestion('\nEnter the linking code from Telegram: ');
    
    if (!linkToken) {
      console.log('Operation cancelled.');
      return;
    }
    
    console.log(`\nLinking account with token: ${linkToken}`);
    const response = await fetch(`${apiBaseUrl}/api/telegram/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token: linkToken })
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`Linking failed (${response.status}): ${responseText}`);
    }
    
    try {
      const data = JSON.parse(responseText);
      if (data.success || data.message) {
        console.log('\n🎉 Success! Your account is now linked to Telegram.');
        console.log('You can now use the Telegram bot to manage your todos.');
      } else {
        console.log('\n❌ Linking may have failed:', data.error || 'Unknown error');
      }
    } catch (e) {
      console.log('\n⚠️ Got non-JSON response, but request was successful.');
      console.log('Please check your Telegram bot to confirm linking.');
    }
  } catch (error) {
    console.error('Linking error:', error.message);
  }
}

async function unlinkAccount(apiBaseUrl, token) {
  try {
    const confirm = await askQuestion('\nAre you sure you want to unlink your Telegram account? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      return;
    }
    
    console.log('\nUnlinking Telegram account...');
    const response = await fetch(`${apiBaseUrl}/api/telegram/unlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Unlinking failed (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success || data.message) {
      console.log('\n✅ Your account has been unlinked from Telegram.');
    } else {
      console.log('\n❌ Unlinking may have failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Unlinking error:', error.message);
  }
}

async function listTodos(apiBaseUrl, token) {
  try {
    console.log('\nFetching your todos...');
    const response = await fetch(`${apiBaseUrl}/api/todos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetching todos failed (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.length) {
      console.log('\nYou have no todos yet.');
      return;
    }
    
    console.log('\n=== Your Todos ===');
    data.forEach((todo, index) => {
      const status = todo.is_completed ? '✅' : '⏳';
      console.log(`${index + 1}. ${status} ${todo.title}`);
      if (todo.description) console.log(`   Description: ${todo.description}`);
      console.log(`   Due: ${new Date(todo.deadline).toLocaleDateString()}`);
      console.log(`   Priority: ${todo.priority}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error fetching todos:', error.message);
  }
}

async function testAiMode(apiBaseUrl, token) {
  console.log('\n=== Testing AI Natural Language Processing ===');
  
  console.log('This test will simulate sending natural language messages to the Telegram bot.');
  console.log('The server will process these through the OpenAI integration.');
  
  // First, check if OpenAI is enabled
  const aiStatusResponse = await fetch(`${apiBaseUrl}/test`);
  
  if (aiStatusResponse.ok) {
    const statusData = await aiStatusResponse.json();
    if (!statusData.ai_enabled) {
      console.log('\n⚠️ AI natural language processing appears to be disabled.');
      console.log('Make sure OPENAI_API_KEY is set in your environment variables.');
      return;
    }
  }
  
  console.log('\n✅ AI natural language processing appears to be enabled.');
  
  // Let user input natural language queries
  while (true) {
    console.log('\nEnter a natural language query to test (or "exit" to return to menu):');
    console.log('Examples:');
    console.log('  - "Add buying groceries to my todos"');
    console.log('  - "Show me all my todos"');
    console.log('  - "Mark my first todo as complete"');
    
    const query = await askQuestion('\nYour query: ');
    
    if (query.toLowerCase() === 'exit') {
      break;
    }
    
    console.log('\nSimulating natural language processing...');
    
    try {
      // This is a simulation since we can't directly access the Telegram bot
      // In a real scenario, the user would send this message to the Telegram bot
      const simulateResponse = await fetch(`${apiBaseUrl}/api/ai/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: query })
      });
      
      if (simulateResponse.ok) {
        const result = await simulateResponse.json();
        console.log('\n🤖 AI Response:');
        console.log(result.response);
      } else {
        const errorText = await simulateResponse.text();
        console.log(`\n❌ Error: ${simulateResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`\n❌ Error simulating AI: ${error.message}`);
    }
  }
}

// Run the main function
main(); 