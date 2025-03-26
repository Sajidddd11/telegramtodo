const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to update environment file
function updateEnvFile(mode, webhookUrl = '') {
  try {
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update BOT_MODE
    if (envContent.includes('BOT_MODE=')) {
      envContent = envContent.replace(/BOT_MODE=.*/, `BOT_MODE=${mode}`);
    } else {
      envContent += `\nBOT_MODE=${mode}`;
    }
    
    // Update TELEGRAM_WEBHOOK_URL if in webhook mode
    if (mode === 'webhook') {
      if (envContent.includes('TELEGRAM_WEBHOOK_URL=')) {
        envContent = envContent.replace(/TELEGRAM_WEBHOOK_URL=.*/, `TELEGRAM_WEBHOOK_URL=${webhookUrl}`);
      } else {
        envContent += `\nTELEGRAM_WEBHOOK_URL=${webhookUrl}`;
      }
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env file - BOT_MODE set to '${mode}'`);
    
    if (mode === 'webhook') {
      console.log(`Webhook URL set to: ${webhookUrl}`);
    }
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Function to set webhook with Telegram
function setTelegramWebhook(token, webhookUrl) {
  console.log('Setting Telegram webhook...');
  
  const command = `curl -X POST "https://api.telegram.org/bot${token}/setWebhook" -H "Content-Type: application/json" -d "{\\"url\\":\\"${webhookUrl}\\"}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error setting webhook:', error);
      return;
    }
    
    console.log('Webhook set response:', stdout);
    console.log('Restart your server to apply changes');
  });
}

// Function to delete webhook with Telegram
function deleteTelegramWebhook(token) {
  console.log('Deleting Telegram webhook...');
  
  const command = `curl -X POST "https://api.telegram.org/bot${token}/deleteWebhook"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error deleting webhook:', error);
      return;
    }
    
    console.log('Webhook delete response:', stdout);
    console.log('Restart your server to apply changes');
  });
}

// Function to extract token from env file
function getTokenFromEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=(.*)/);
    
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1].trim();
    }
    
    return null;
  } catch (error) {
    console.error('Error reading token from .env:', error);
    return null;
  }
}

// Main function
async function main() {
  console.log('=== Telegram Bot Mode Switcher ===\n');
  console.log('1. Switch to Polling mode (local development)');
  console.log('2. Switch to Webhook mode (production/ngrok)');
  console.log('3. Exit\n');
  
  rl.question('Select an option (1-3): ', (answer) => {
    const token = getTokenFromEnv();
    
    if (!token) {
      console.error('Error: Could not find TELEGRAM_BOT_TOKEN in .env file');
      rl.close();
      return;
    }
    
    switch (answer) {
      case '1':
        // Switch to polling mode
        updateEnvFile('polling');
        deleteTelegramWebhook(token);
        break;
        
      case '2':
        // Switch to webhook mode
        rl.question('Enter webhook URL (e.g., https://your-ngrok-url/api/telegram/webhook): ', (webhookUrl) => {
          if (!webhookUrl) {
            console.log('Webhook URL is required for webhook mode');
            rl.close();
            return;
          }
          
          updateEnvFile('webhook', webhookUrl);
          setTelegramWebhook(token, webhookUrl);
          rl.close();
        });
        return; // Don't close rl yet
        
      case '3':
        console.log('Exiting...');
        break;
        
      default:
        console.log('Invalid option');
        break;
    }
    
    rl.close();
  });
}

// Run the main function
main(); 