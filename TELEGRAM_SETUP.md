# Telegram Integration Setup Guide

This guide will help you set up and troubleshoot the Telegram integration for the Todo App.

## Prerequisites

1. A Telegram account
2. BotFather access (https://t.me/botfather)
3. Your Todo App backend deployed or running locally

## Step 1: Create a Telegram Bot

1. Open Telegram and search for "BotFather"
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to create a new bot:
   - Provide a name for your bot (e.g., "My Todo App Bot")
   - Provide a username for your bot (must end with "bot", e.g., "my_todo_app_bot")
4. Once created, BotFather will give you a token. This is your `TELEGRAM_BOT_TOKEN`
5. Save this token! You'll need it for the next step

## Step 2: Configure Environment Variables

Add the Telegram bot token to your environment variables:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

You can add this to your `.env` file or set it directly in your hosting environment (Vercel, Heroku, etc.).

## Step 3: Set Up Database Functions

The Telegram integration requires two tables in your Supabase database and special functions to bypass RLS restrictions. Run the following SQL in your Supabase SQL Editor:

```sql
-- Create table for storing Telegram user links
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  chat_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);

-- Create table for temporary linking tokens
CREATE TABLE IF NOT EXISTS telegram_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telegram_tokens_token ON telegram_tokens(token);

-- Create functions that bypass RLS
CREATE OR REPLACE FUNCTION store_telegram_token(
    p_token TEXT,
    p_chat_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN;
BEGIN
    -- Delete any existing tokens for this chat ID
    DELETE FROM telegram_tokens WHERE chat_id = p_chat_id;
    
    -- Insert new token
    INSERT INTO telegram_tokens (
        token, 
        chat_id, 
        created_at, 
        expires_at
    ) VALUES (
        p_token,
        p_chat_id,
        NOW(),
        NOW() + INTERVAL '30 minutes'
    );
    
    success := FOUND;
    RETURN success;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error storing token: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify a token
CREATE OR REPLACE FUNCTION verify_telegram_token(
    p_token TEXT
) RETURNS TEXT AS $$
DECLARE
    chat_id TEXT;
BEGIN
    -- Get the chat ID for the token
    SELECT t.chat_id INTO chat_id
    FROM telegram_tokens t
    WHERE t.token = p_token
    AND t.expires_at > NOW();
    
    -- Delete the token to prevent reuse
    IF chat_id IS NOT NULL THEN
        DELETE FROM telegram_tokens WHERE token = p_token;
    END IF;
    
    RETURN chat_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error verifying token: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link a user to a chat ID
CREATE OR REPLACE FUNCTION link_telegram_user(
    p_user_id UUID,
    p_chat_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN;
BEGIN
    -- Delete any existing links for this chat ID
    DELETE FROM telegram_users WHERE chat_id = p_chat_id;
    
    -- Insert new link
    INSERT INTO telegram_users (
        user_id,
        chat_id,
        created_at
    ) VALUES (
        p_user_id,
        p_chat_id,
        NOW()
    );
    
    success := FOUND;
    RETURN success;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error linking user: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 4: Configure Webhook (Production Only)

For production environments, you need to set up a webhook so Telegram can send updates to your server:

1. Deploy your application with the Telegram routes enabled
2. Set the webhook URL using one of these methods:
   - Run this command (replace with your actual domain):
     ```
     curl -F "url=https://yourdomain.com/api/telegram/webhook" https://api.telegram.org/bot{your_bot_token}/setWebhook
     ```
   - Or navigate to: `https://api.telegram.org/bot{your_bot_token}/setWebhook?url=https://yourdomain.com/api/telegram/webhook`

3. Verify the webhook is set up correctly:
   ```
   curl https://api.telegram.org/bot{your_bot_token}/getWebhookInfo
   ```

## Step 5: Testing the Integration

To test the Telegram integration, you can use our interactive testing tool:

```bash
node telegram-link-test.js
```

This script will guide you through:
1. Logging in to your Todo App account
2. Checking if you already have a linked Telegram account
3. Receiving a linking code from the Telegram bot
4. Linking your account with the code

## Troubleshooting

### Problem: Bot doesn't respond to commands

1. Check if your `TELEGRAM_BOT_TOKEN` is correct
2. Ensure the bot is properly initialized in your code
3. Verify webhook setup for production environments
4. Check server logs for any errors

### Problem: Cannot link account

1. Make sure you're using a fresh token (they expire after 30 minutes)
2. Verify that your user account exists in the database
3. Check for any error messages during the linking process
4. Verify that the RPC functions are created in your Supabase database

### Problem: Database Permission Issues

If you're seeing database permission errors:

1. Verify that the SQL functions with `SECURITY DEFINER` are created correctly
2. Try disabling RLS on the telegram tables for testing:
   ```sql
   ALTER TABLE telegram_tokens DISABLE ROW LEVEL SECURITY;
   ALTER TABLE telegram_users DISABLE ROW LEVEL SECURITY;
   ```

## Additional Commands

The Todo bot supports these commands:

- `/start` - Start the bot and get a linking code
- `/help` - Show available commands
- `/list` - List your todos
- `/add <task>` - Add a new todo
- `/done <number>` - Mark a todo as complete
- `/delete <number>` - Delete a todo
- `/show <number>` - View details of a specific todo

## Support

If you encounter issues that aren't resolved by this guide, please:

1. Check the server logs for detailed error messages
2. Review the Telegram integration code for any bugs
3. Verify the database tables and functions are properly set up 