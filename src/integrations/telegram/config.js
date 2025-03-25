/**
 * Telegram bot configuration
 * You'll need to create a bot with BotFather and add the token to your .env file
 */

const BOT_COMMANDS = [
  { command: 'start', description: 'Start the bot and get help' },
  { command: 'help', description: 'Show available commands' },
  { command: 'list', description: 'List all your todos' },
  { command: 'add', description: 'Add a new todo. Format: /add Buy groceries' },
  { command: 'done', description: 'Mark a todo as complete. Format: /done 1' },
  { command: 'delete', description: 'Delete a todo. Format: /delete 1' },
  { command: 'show', description: 'Show a specific todo. Format: /show 1' },
];

module.exports = {
  BOT_COMMANDS
}; 