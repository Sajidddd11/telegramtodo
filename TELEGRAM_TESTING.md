# Telegram Integration Testing Guide

This document provides instructions for testing the Telegram bot integration without requiring frontend changes.

## Prerequisites

1. Create a Telegram bot using BotFather (https://t.me/botfather)
2. Add the bot token to your `.env` file
3. Run the SQL scripts in `src/integrations/telegram/setup.sql` in your Supabase SQL Editor
4. Start your server locally with `npm run dev`

## Manual Testing Flow

### 1. Setup a Test User

Make sure you have a registered user in your app. You can use the registration API endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "username": "testuser",
    "password": "password123"
  }'
```

### 2. Start a Chat with Your Bot

Find your bot on Telegram and start a chat. Use the `/start` command to receive a linking code.

### 3. Manually Link the User in Supabase

Instead of implementing the frontend integration, you can manually link the user by inserting a record in the `telegram_users` table:

1. Log in to your Supabase dashboard
2. Go to the Table Editor
3. Select the `telegram_users` table
4. Click "Insert Row" and add:
   - `user_id`: [Your test user's ID from the users table]
   - `chat_id`: [The chat ID from your Telegram conversation - you can find this in your server logs]
   - Leave the other fields to auto-fill

### 4. Test Bot Commands

Now test the following commands in your Telegram chat:

- `/help` - Should list available commands
- `/list` - Should show empty todos list initially
- `/add Buy groceries` - Should create a new todo
- `/list` - Should now show the todo you created
- `/done 1` - Should mark the first todo as complete
- `/show 1` - Should show details of the first todo
- `/delete 1` - Should delete the first todo
- `/list` - Should show empty list again

## Troubleshooting

### Bot Not Responding

Check the server logs for errors. Make sure:
- The bot token is correct
- The bot is initialized properly in the logs
- In polling mode (development), the bot should automatically receive messages

### Database Errors

If you see database errors in the logs:
- Verify the tables are created correctly
- Check that your Supabase credentials are correct
- Ensure the user ID you're using actually exists in the users table

### Command Parsing Issues

If commands are not being recognized:
- Make sure to use the exact format (e.g., `/add Task name` with a space after the command)
- Check the regex patterns in the bot.js file if needed
- Ensure you're not hitting any error conditions in the command handlers

## Next Steps for Production

For production deployment:
1. Implement the frontend integration using the `/api/telegram/link` endpoint
2. Set up the webhook for production as described in the README
3. Make sure your production server has HTTPS enabled
4. Consider adding more sophisticated error handling and logging 