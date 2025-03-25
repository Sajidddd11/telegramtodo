/**
 * Telegram database interface using RPC calls to bypass RLS
 */
const supabase = require('../../utils/supabase');

/**
 * Link a Telegram chat ID to a user
 * @param {string} userId - The user ID in our system
 * @param {string} chatId - The Telegram chat ID
 * @returns {Promise<boolean>} - Success status
 */
async function linkTelegramUser(userId, chatId) {
  try {
    console.log(`Attempting to link user ID ${userId} with chat ID ${chatId} via RPC`);
    
    // Convert chatId to string if it's not already
    const chatIdStr = String(chatId);
    
    // Use the RPC function to link user
    const { data, error } = await supabase.rpc('link_telegram_user', {
      p_user_id: userId,
      p_chat_id: chatIdStr
    });

    if (error) {
      console.error('Error linking user via RPC:', error);
      return false;
    }

    console.log(`Successfully linked chat ID ${chatId} to user ${userId} via RPC`);
    return data;
  } catch (error) {
    console.error('Error linking Telegram user:', error);
    return false;
  }
}

/**
 * Get user ID associated with a Telegram chat ID
 * @param {string} chatId - The Telegram chat ID
 * @returns {Promise<string|null>} - The user ID or null if not found
 */
async function getUserIdByChatId(chatId) {
  try {
    console.log(`Looking up user ID for chat ID: ${chatId}`);
    
    // Convert chatId to string if it's not already
    const chatIdStr = String(chatId);
    console.log(`Using chat ID for query: ${chatIdStr}`);
    
    // Direct query bypassing RLS
    const { data, error } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('chat_id', chatIdStr);

    console.log(`Query result - data:`, data, `error:`, error);
    
    if (error) {
      console.error('Database error when getting user by chat ID:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`No user found for chat ID: ${chatId}`);
      return null;
    }

    console.log(`Found user ID: ${data[0].user_id} for chat ID: ${chatId}`);
    return data[0].user_id;
  } catch (error) {
    console.error('Error getting user by chat ID:', error);
    return null;
  }
}

/**
 * Store a temporary token for linking a user
 * @param {string} token - The generated token
 * @param {string} chatId - The Telegram chat ID
 * @returns {Promise<boolean>} - Success status
 */
async function storeLinkToken(token, chatId) {
  try {
    // Convert chatId to string if it's not already
    const chatIdStr = String(chatId);
    
    console.log(`Storing link token ${token} for chat ID ${chatIdStr} via RPC`);
    
    // Use the RPC function to store token
    const { data, error } = await supabase.rpc('store_telegram_token', {
      p_token: token,
      p_chat_id: chatIdStr
    });

    if (error) {
      console.error('Error storing token via RPC:', error);
      return false;
    }
    
    console.log(`Token ${token} stored successfully for chat ID ${chatIdStr}`);
    return data;
  } catch (error) {
    console.error('Error storing link token:', error);
    return false;
  }
}

/**
 * Verify and consume a linking token
 * @param {string} token - The token to verify
 * @returns {Promise<string|null>} - The chat ID or null if invalid
 */
async function verifyLinkToken(token) {
  try {
    console.log(`Verifying link token: ${token} via RPC`);
    
    // Use the RPC function to verify token
    const { data, error } = await supabase.rpc('verify_telegram_token', {
      p_token: token
    });

    if (error) {
      console.error('Error verifying token via RPC:', error);
      return null;
    }

    console.log(`Token verification result:`, data);
    return data;
  } catch (error) {
    console.error('Error verifying link token:', error);
    return null;
  }
}

/**
 * Unlink a Telegram user
 * @param {string} userId - The user ID in our system
 * @returns {Promise<boolean>} - Success status
 */
async function unlinkTelegramUser(userId) {
  try {
    const { error } = await supabase
      .from('telegram_users')
      .delete()
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error unlinking Telegram user:', error);
    return false;
  }
}

module.exports = {
  linkTelegramUser,
  getUserIdByChatId,
  storeLinkToken,
  verifyLinkToken,
  unlinkTelegramUser
}; 