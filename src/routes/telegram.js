const express = require('express');
const router = express.Router();
const telegramBot = require('../integrations/telegram/bot');
const telegramDb = require('../integrations/telegram/database');
const authMiddleware = require('../middleware/auth');
const supabase = require('../utils/supabase');

// Initialize the bot when this module is loaded
const bot = telegramBot.initBot();

/**
 * Webhook endpoint for Telegram
 * This is configured in the Telegram bot's webhook settings
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', JSON.stringify({
      timestamp: new Date().toISOString(),
      headers: req.headers['content-type'],
      body: req.body ? (typeof req.body === 'object' ? Object.keys(req.body) : 'non-object') : 'empty',
      method: req.method
    }));
    
    // Get bot instance
    const botInstance = telegramBot.getBot();
    
    if (!botInstance) {
      console.error('Bot not initialized, cannot process webhook');
      return res.status(500).send('Bot not initialized');
    }
    
    // Process the update from Telegram
    await botInstance.processUpdate(req.body);
    console.log('Webhook processed successfully');
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing update');
  }
});

/**
 * Link a user account with Telegram
 * Protected route - requires authentication
 */
router.post('/link', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { token } = req.body;

    console.log(`Linking request for user ${userId} with token ${token}`);

    if (!token) {
      return res.status(400).json({ 
        success: false,
        error: 'Token is required' 
      });
    }

    // Verify the token and get the chat ID
    const chatId = await telegramDb.verifyLinkToken(token);
    
    if (!chatId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid or expired token. Please request a new token by starting the bot again.' 
      });
    }

    // Link the user to the Telegram chat ID
    const success = await telegramDb.linkTelegramUser(userId, chatId);
    
    if (!success) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to link account. Please try again.' 
      });
    }

    // Send a success message to the Telegram chat
    const botInstance = telegramBot.getBot();
    if (botInstance) {
      await botInstance.sendMessage(
        chatId, 
        '🎉 Your Todo App account has been successfully linked!\n\nYou can now manage your todos through this chat. Try /help to see available commands.'
      );
    }

    res.json({ 
      success: true,
      message: 'Account linked successfully' 
    });
  } catch (error) {
    console.error('Error linking account:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during account linking' 
    });
  }
});

/**
 * DEBUG: Check if a chat ID is linked to a user
 * This endpoint helps diagnose linking issues
 */
router.get('/debug/:chatId', async (req, res) => {
  try {
    const chatId = req.params.chatId;
    
    // Check directly in the database
    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('chat_id', chatId);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Also check in the token table if there's a pending token
    const { data: tokenData, error: tokenError } = await supabase
      .from('telegram_tokens')
      .select('*')
      .eq('chat_id', chatId);
    
    res.json({
      linked: data && data.length > 0,
      linkData: data,
      hasPendingToken: tokenData && tokenData.length > 0,
      tokenData: tokenData
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Unlink a user account from Telegram
 * Protected route - requires authentication
 */
router.post('/unlink', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user.id;
    
    // Unlink the user from Telegram
    const success = await telegramDb.unlinkTelegramUser(userId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to unlink account' });
    }

    res.json({ message: 'Account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking account:', error);
    res.status(500).json({ error: 'Server error during account unlinking' });
  }
});

/**
 * Check if user is linked to Telegram
 * Protected route - requires authentication
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user.id;
    
    console.log(`Checking Telegram link status for user ${userId}`);
    
    // Check if the user has any linked Telegram accounts
    const { data, error } = await supabase
      .from('telegram_users')
      .select('chat_id, created_at')
      .eq('user_id', userId);
    
    console.log('Status check result:', data, error);
    
    if (error) {
      console.error('Database error in status check:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error checking link status' 
      });
    }
    
    const isLinked = data && data.length > 0;
    const linkData = isLinked ? data[0] : null;
    
    res.json({ 
      success: true,
      linked: isLinked,
      linkInfo: isLinked ? {
        chatId: linkData.chat_id,
        linkedAt: linkData.created_at
      } : null
    });
  } catch (error) {
    console.error('Error checking link status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error checking link status' 
    });
  }
});

/**
 * TEMPORARY: Force link a Telegram chat ID to a user ID 
 * This is for troubleshooting purposes only
 */
router.get('/force-link/:chatId/:userId', async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    
    console.log(`Force linking chat ID ${chatId} to user ID ${userId}`);
    
    // First, remove any existing links for this chat ID
    await supabase
      .from('telegram_users')
      .delete()
      .eq('chat_id', chatId);
      
    // Create a new link
    const { data, error } = await supabase
      .from('telegram_users')
      .insert([{
        user_id: userId,
        chat_id: chatId,
        created_at: new Date()
      }]);
    
    if (error) {
      console.error('Error force-linking:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({ 
      success: true, 
      message: 'Force linked successfully',
      data: { userId, chatId }
    });
  } catch (error) {
    console.error('Error in force-link endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * TEMPORARY: List all users for troubleshooting
 */
router.get('/list-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, email')
      .limit(10);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ users: data });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 