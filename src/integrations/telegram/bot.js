const TelegramBot = require('node-telegram-bot-api');
const { v4: uuidv4 } = require('uuid');
const { BOT_COMMANDS } = require('./config');
const telegramDb = require('./database');
const todoController = require('../../controllers/todoController');
const supabase = require('../../utils/supabase');

// Check for token in environment
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

// Create bot instance (webhook mode will be set in setupWebhook)
let bot = null;

/**
 * Initialize the bot and setup commands
 */
function initBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot not initialized - missing token');
    return null;
  }

  try {
    // Get bot mode from environment variable, default to polling if not specified
    const botMode = (process.env.BOT_MODE || 'polling').toLowerCase();
    console.log(`Initializing Telegram bot in ${botMode} mode`);
    
    // Initialize bot with appropriate options based on mode
    let options;
    
    if (botMode === 'webhook') {
      options = {
        polling: false,
        filepath: false,
        webHook: {
          port: process.env.PORT || 3000
        }
      };
    } else {
      // Default to polling mode
      options = {
        polling: true,
        filepath: false // Disable file downloads to prevent timeouts
      };
    }

    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, options);

    // Add error handler for bot
    bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    // Set up command descriptions
    bot.setMyCommands(BOT_COMMANDS).catch(error => {
      console.error('Error setting bot commands:', error);
    });

    // Register command handlers
    setupCommandHandlers(bot);

    // In webhook mode, set up the webhook URL
    if (botMode === 'webhook') {
      const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn('Webhook URL not specified in environment variables. Webhook not set.');
      } else {
        bot.setWebHook(webhookUrl).then(() => {
          console.log('Webhook set successfully:', webhookUrl);
        }).catch(error => {
          console.error('Error setting webhook:', error);
        });
      }
    }

    console.log('Telegram bot initialized successfully');
    return bot;
  } catch (error) {
    console.error('Error initializing Telegram bot:', error);
    return null;
  }
}

/**
 * Get the bot instance
 * @returns {TelegramBot|null} - The bot instance or null if not initialized
 */
function getBot() {
  return bot;
}

/**
 * Set up the bot to use webhook in production
 * @param {string} webhookUrl - Full URL to the webhook endpoint
 */
function setupWebhook(webhookUrl) {
  if (!bot || !webhookUrl || process.env.NODE_ENV !== 'production') return;

  bot.setWebHook(webhookUrl).then(() => {
    console.log(`Webhook set to ${webhookUrl}`);
  }).catch(error => {
    console.error('Error setting webhook:', error);
  });
}

/**
 * Process an update from Telegram webhook
 * @param {Object} update - The update object from Telegram
 */
async function processUpdate(update) {
  if (!bot) {
    console.error('Cannot process update: bot not initialized');
    return;
  }
  
  try {
    console.log('Processing update:', JSON.stringify(update).slice(0, 200) + '...');
    await bot.processUpdate(update);
    console.log('Update processed successfully');
  } catch (error) {
    console.error('Error processing update:', error);
    throw error;
  }
}

/**
 * Generate a random token for linking
 * @returns {string} - 6-digit token
 */
function generateLinkToken() {
  // Generate a 6-digit numeric token
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Register all command handlers
 * @param {TelegramBot} bot - The bot instance
 */
function setupCommandHandlers(bot) {
  // Start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(`Received /start command from chat ID: ${chatId}`);
    
    const userId = await telegramDb.getUserIdByChatId(chatId);
    console.log(`Lookup result - User ID for chat ${chatId}: ${userId || 'Not found'}`);

    if (!userId) {
      // Generate token for linking
      const token = generateLinkToken();
      await telegramDb.storeLinkToken(token, chatId);

      const welcomeMsg = `
Welcome to the Todo App Bot! 🤖

To use this bot, you need to link it with your Todo App account.

Your linking code is: *${token}*

Please go to your Todo App and enter this code to connect your account.
      `;
      
      await bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, 
        "Welcome back to Todo App Bot! 📝\n\nUse /help to see available commands."
      );
    }
  });

  // Help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = await telegramDb.getUserIdByChatId(chatId);

    if (!userId) {
      await bot.sendMessage(chatId, 
        "You need to link your account first. Use /start to get a linking code."
      );
      return;
    }

    let helpText = "📋 *Available Commands*\n\n";
    BOT_COMMANDS.forEach(cmd => {
      helpText += `/${cmd.command} - ${cmd.description}\n`;
    });

    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  });

  // List todos
  bot.onText(/\/list/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = await telegramDb.getUserIdByChatId(chatId);

    if (!userId) {
      await bot.sendMessage(chatId, 
        "You need to link your account first. Use /start to get a linking code."
      );
      return;
    }

    try {
      // Get todos from database
      const { data: todos, error } = await todoController.getUserTodos(userId);
      
      if (error || !todos) {
        await bot.sendMessage(chatId, "Failed to fetch your todos.");
        return;
      }

      if (todos.length === 0) {
        await bot.sendMessage(chatId, "You don't have any todos yet. Use /add to create one.");
        return;
      }

      // Format todos list
      let message = "📋 *Your Todos*\n\n";
      todos.forEach((todo, index) => {
        const status = todo.is_completed ? "✅" : "⏳";
        const dueDate = new Date(todo.deadline).toLocaleDateString();
        message += `${index + 1}. ${status} ${todo.title}\n`;
        if (todo.description) message += `   _${todo.description}_\n`;
        message += `   Due: ${dueDate}\n\n`;
      });

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error listing todos:', error);
      await bot.sendMessage(chatId, "An error occurred while fetching your todos.");
    }
  });

  // Add todo
  bot.onText(/\/add (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = await telegramDb.getUserIdByChatId(chatId);

    if (!userId) {
      await bot.sendMessage(chatId, 
        "You need to link your account first. Use /start to get a linking code."
      );
      return;
    }

    const text = match[1];
    
    try {
      // Default deadline to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Create todo
      const { todo, error } = await todoController.createUserTodo(userId, {
        title: text,
        description: '',
        deadline: tomorrow.toISOString(),
        priority: 3
      });

      if (error) {
        await bot.sendMessage(chatId, `Failed to create todo: ${error}`);
        return;
      }

      await bot.sendMessage(chatId, 
        `✅ Todo created successfully!\n\nTitle: ${todo.title}\nDue: ${new Date(todo.deadline).toLocaleDateString()}`
      );
    } catch (error) {
      console.error('Error creating todo:', error);
      await bot.sendMessage(chatId, "An error occurred while creating your todo.");
    }
  });

  // Mark todo as complete
  bot.onText(/\/done (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = await telegramDb.getUserIdByChatId(chatId);

    if (!userId) {
      await bot.sendMessage(chatId, 
        "You need to link your account first. Use /start to get a linking code."
      );
      return;
    }

    const todoIndex = parseInt(match[1]) - 1;
    
    try {
      // Get todos list
      const { data: todos, error } = await todoController.getUserTodos(userId);
      
      if (error || !todos) {
        await bot.sendMessage(chatId, "Failed to fetch your todos.");
        return;
      }

      if (todoIndex < 0 || todoIndex >= todos.length) {
        await bot.sendMessage(chatId, "Invalid todo number. Use /list to see your todos.");
        return;
      }

      const todo = todos[todoIndex];

      // Update todo
      const { error: updateError } = await todoController.updateUserTodo(
        userId, 
        todo.id, 
        { is_completed: true }
      );

      if (updateError) {
        await bot.sendMessage(chatId, `Failed to update todo: ${updateError}`);
        return;
      }

      await bot.sendMessage(chatId, `✅ "${todo.title}" marked as complete!`);
    } catch (error) {
      console.error('Error completing todo:', error);
      await bot.sendMessage(chatId, "An error occurred while updating your todo.");
    }
  });

  // Delete todo
  bot.onText(/\/delete (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = await telegramDb.getUserIdByChatId(chatId);

    if (!userId) {
      await bot.sendMessage(chatId, 
        "You need to link your account first. Use /start to get a linking code."
      );
      return;
    }

    const todoIndex = parseInt(match[1]) - 1;
    
    try {
      // Get todos list
      const { data: todos, error } = await todoController.getUserTodos(userId);
      
      if (error || !todos) {
        await bot.sendMessage(chatId, "Failed to fetch your todos.");
        return;
      }

      if (todoIndex < 0 || todoIndex >= todos.length) {
        await bot.sendMessage(chatId, "Invalid todo number. Use /list to see your todos.");
        return;
      }

      const todo = todos[todoIndex];

      // Delete todo
      const { error: deleteError } = await todoController.deleteUserTodo(userId, todo.id);

      if (deleteError) {
        await bot.sendMessage(chatId, `Failed to delete todo: ${deleteError}`);
        return;
      }

      await bot.sendMessage(chatId, `🗑️ "${todo.title}" has been deleted.`);
    } catch (error) {
      console.error('Error deleting todo:', error);
      await bot.sendMessage(chatId, "An error occurred while deleting your todo.");
    }
  });

  // Show specific todo
  bot.onText(/\/show (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = await telegramDb.getUserIdByChatId(chatId);

    if (!userId) {
      await bot.sendMessage(chatId, 
        "You need to link your account first. Use /start to get a linking code."
      );
      return;
    }

    const todoIndex = parseInt(match[1]) - 1;
    
    try {
      // Get todos list
      const { data: todos, error } = await todoController.getUserTodos(userId);
      
      if (error || !todos) {
        await bot.sendMessage(chatId, "Failed to fetch your todos.");
        return;
      }

      if (todoIndex < 0 || todoIndex >= todos.length) {
        await bot.sendMessage(chatId, "Invalid todo number. Use /list to see your todos.");
        return;
      }

      const todo = todos[todoIndex];
      const status = todo.is_completed ? "Completed ✅" : "Pending ⏳";
      const dueDate = new Date(todo.deadline).toLocaleDateString();
      const priority = "⭐".repeat(todo.priority);

      let detailText = `📝 *${todo.title}*\n\n`;
      if (todo.description) detailText += `Description: ${todo.description}\n\n`;
      detailText += `Status: ${status}\n`;
      detailText += `Due: ${dueDate}\n`;
      detailText += `Priority: ${priority}\n`;
      detailText += `Created: ${new Date(todo.created_at).toLocaleDateString()}`;

      await bot.sendMessage(chatId, detailText, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error showing todo:', error);
      await bot.sendMessage(chatId, "An error occurred while fetching todo details.");
    }
  });

  // Add a catch-all handler for any message that doesn't match commands
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    
    // Skip if it's a command
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }
    
    const userId = await telegramDb.getUserIdByChatId(chatId);
    
    if (!userId) {
      // Give helpful debugging info
      await bot.sendMessage(chatId, 
        `Your chat ID is: ${chatId}\n\n` +
        `You are not linked to a user account yet. Use /start to get a linking code or contact the administrator.`
      );
    } else {
      await bot.sendMessage(chatId, 
        `You are linked to user ID: ${userId}\n\n` +
        `Try using the /help command to see available commands.`
      );
    }
  });
}

/**
 * Helper to extend todo controller functionality
 */
todoController.getUserTodos = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching user todos:', error);
    return { error: 'Server error' };
  }
};

todoController.createUserTodo = async (userId, todoData) => {
  try {
    const todoId = uuidv4();
    const newTodo = {
      id: todoId,
      title: todoData.title,
      description: todoData.description || '',
      is_completed: false,
      priority: todoData.priority || 3,
      deadline: todoData.deadline,
      user_id: userId,
      created_at: new Date()
    };

    const { error } = await supabase
      .from('todos')
      .insert([newTodo]);

    return { todo: newTodo, error };
  } catch (error) {
    console.error('Error creating todo:', error);
    return { error: 'Server error' };
  }
};

todoController.updateUserTodo = async (userId, todoId, todoData) => {
  try {
    // Check if the todo exists and belongs to the user
    const { data: existingTodo, error: checkError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      return { error: 'Todo not found or permission denied' };
    }

    // Update the todo
    const { error } = await supabase
      .from('todos')
      .update({
        ...todoData,
        updated_at: new Date()
      })
      .eq('id', todoId)
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    console.error('Error updating todo:', error);
    return { error: 'Server error' };
  }
};

todoController.deleteUserTodo = async (userId, todoId) => {
  try {
    // Check if the todo exists and belongs to the user
    const { data: existingTodo, error: checkError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      return { error: 'Todo not found or permission denied' };
    }

    // Delete the todo
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    console.error('Error deleting todo:', error);
    return { error: 'Server error' };
  }
};

// Add a function to check bot health
function checkBotHealth() {
  if (!bot) {
    console.warn('Bot not initialized');
    return false;
  }
  
  try {
    // Try to get bot info to verify it's working
    bot.getMe().then(info => {
      console.log('Bot health check successful:', info);
      return true;
    }).catch(error => {
      console.error('Bot health check failed:', error);
      return false;
    });
  } catch (error) {
    console.error('Error checking bot health:', error);
    return false;
  }
}

// Export the bot functions
module.exports = {
  initBot,
  getBot,
  setupWebhook,
  processUpdate,
  bot // For backward compatibility
}; 