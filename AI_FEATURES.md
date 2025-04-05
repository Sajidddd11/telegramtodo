# AI Natural Language Todo Management

This application now includes AI-powered natural language processing for managing todos through Telegram. You can talk to your Telegram bot in natural language to create, update, view, and delete todos.

## Setup

1. Make sure you have a valid OpenAI API key.
2. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```
3. Restart the application.

## Using Natural Language in Telegram

1. Start a chat with your Telegram bot
2. Link your account using the `/start` command and follow the instructions
3. Type `/ai` to activate the AI natural language mode
4. Start sending natural language requests about your todos!

## Example Commands

You can use natural language to:

### Create Todos
- "Add grocery shopping to my todos"
- "Create a high priority task for meeting with client tomorrow"
- "Remind me to call John next Monday"
- "I need to finish the report by Friday"

### View Todos
- "Show me all my todos"
- "What are my high priority tasks?"
- "Show me todos due this week"
- "Do I have any tasks about meetings?"

### Update Todos
- "Mark the grocery shopping task as done"
- "Change the deadline for the report to next Tuesday"
- "Update the priority of the client meeting to high"
- "Rename my 'call John' task to 'call John about project proposal'"

### Delete Todos
- "Delete the grocery shopping todo"
- "Remove all completed tasks"
- "Cancel my meeting with Sarah"

## Technical Details

The AI integration uses OpenAI's GPT models to:

1. Understand the intent of your natural language request
2. Extract relevant information (task title, deadline, priority, etc.)
3. Execute the appropriate actions on your todos
4. Generate a natural language response

The integration follows a Plan-Action-Observation-Output pattern:
1. **Plan**: The AI interprets your request and plans what actions to take
2. **Action**: The AI executes one or more operations on your todos
3. **Observation**: The AI observes the results of the operations
4. **Output**: The AI generates a natural language response based on the observations

## Troubleshooting

If the AI is not responding correctly:

1. Make sure your OpenAI API key is valid and has sufficient credits
2. Check that you have properly linked your Telegram account
3. Try being more specific in your request
4. If all else fails, you can always use the traditional command-based interface with commands like `/list`, `/add`, etc.

## Privacy Note

Your todo data and conversations are processed using OpenAI's API. While we do not store your conversations, they are transmitted to OpenAI for processing. Please refer to OpenAI's privacy policy for more information on how they handle data. 