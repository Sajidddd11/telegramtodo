-- Create table for storing Telegram user links
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index for quick lookups by chat_id
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(chat_id);

-- Create index for quick lookups by user_id
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);

-- Create table for temporary linking tokens
CREATE TABLE IF NOT EXISTS telegram_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Create index for quick token lookups
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_token ON telegram_tokens(token);

-- Create index for token expiration cleanup
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_expires_at ON telegram_tokens(expires_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for telegram_users - allow users to see only their own links
CREATE POLICY "Users can only see their own telegram links" 
  ON telegram_users FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow service role to manage all links
CREATE POLICY "Service role can manage all telegram links" 
  ON telegram_users FOR ALL 
  USING (auth.role() = 'service_role');

-- Policy for telegram_tokens - only service role should access this
CREATE POLICY "Service role can manage tokens" 
  ON telegram_tokens FOR ALL 
  USING (auth.role() = 'service_role');

-- Note: The pgcron extension may not be available.
-- You can manually run this query periodically to clean up expired tokens:
-- DELETE FROM telegram_tokens WHERE expires_at < NOW(); 