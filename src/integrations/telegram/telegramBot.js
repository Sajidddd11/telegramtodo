// Handle regular messages
bot.on('message', async (msg) => {
  try {
    // Get basic message info
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const messageText = msg.text;

    // Ignore non-text messages
    if (!messageText) {
      return;
    }

    // Check if user is already registered
    let user = await userController.getUserByTelegramId(userId);
    if (!user) {
      console.log(`New user with telegram_id ${userId} - registering`);
      
      // Create a new user
      const userData = {
        telegram_id: userId,
        username: msg.from.username || `user_${userId}`,
        first_name: msg.from.first_name || '',
        last_name: msg.from.last_name || '',
        created_at: new Date()
      };
      
      const newUser = await userController.createUser(userData);
      user = newUser;
      
      await bot.sendMessage(chatId, 'Welcome to TodoBot! 👋 I can help you manage your tasks using natural language. Try saying something like "Add a task to buy groceries tomorrow" or "Show me all my tasks".');
    }
    
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');
    
    // Log the incoming message
    console.log(`Received message from ${user.username} (${userId}): ${messageText}`);
    
    // Check for direct commands first
    if (messageText.startsWith('/start')) {
      await bot.sendMessage(chatId, 'Welcome to TodoBot! 👋 I can help you manage your tasks using natural language. Try saying something like "Add a task to buy groceries tomorrow" or "Show me all my tasks".');
      return;
    }
    
    // Process the message through OpenAI
    try {
      // Get response from OpenAI
      const aiResponse = await aiClient.processNaturalLanguageRequest(userId, messageText);
      
      // Process the AI response to handle actions and formatting
      const processedResponse = await aiClient.processAIResponse(userId, messageText, aiResponse);
      
      // Send the response back to the user without Markdown parsing
      await bot.sendMessage(chatId, processedResponse);
    } catch (error) {
      console.error('Error processing AI response:', error);
      await bot.sendMessage(chatId, 'Sorry, I encountered an error processing your request. Please try again later.');
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    try {
      await bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again later.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
});

// Handle the /list command
bot.onText(/\/list/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    console.log(`Received /list command from user ${userId}`);
    
    // Get user from DB
    const user = await userController.getUserByTelegramId(userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      await bot.sendMessage(chatId, 'Please start the bot first with /start command');
      return;
    }
    
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');
    
    // Get todos
    const { todos, error } = await todoController.getUserTodos(user.user_id);
    if (error) {
      console.error(`Error getting todos for user ${userId}:`, error);
      await bot.sendMessage(chatId, 'Sorry, I had trouble getting your todos. Please try again later.');
      return;
    }
    
    if (!todos || todos.length === 0) {
      await bot.sendMessage(chatId, "You don't have any tasks yet, boss! Would you like to create one? 📝");
      return;
    }
    
    // Format todos for display
    function formatDate(dateString) {
      if (!dateString) return 'No deadline';
      try {
        const date = new Date(dateString);
        const options = {
          timeZone: 'Asia/Dhaka',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
      } catch (error) {
        return dateString;
      }
    }
    
    const todoList = todos.map((todo, index) => {
      const deadline = formatDate(todo.deadline);
      const isCompleted = todo.is_completed === 'Yes' || todo.is_completed === true;
      const priority = parseInt(todo.priority) || 3;
      const priorityText = priority <= 2 ? 'High' : (priority <= 4 ? 'Medium' : 'Low');
      
      return `${index + 1}. ${todo.title}\n   • Deadline: ${deadline}\n   • Priority: ${priorityText} (${priority})\n   • Completed: ${isCompleted ? '✅' : '❌'}`;
    }).join('\n\n');
    
    await bot.sendMessage(chatId, `Here are your tasks, boss! 📋\n\n${todoList}`);
    
  } catch (error) {
    console.error('Error handling /list command:', error);
    try {
      await bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again later.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}); 