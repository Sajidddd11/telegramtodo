# Todo App Backend

This is the backend for a Todo application, built with Node.js, Express, and Supabase.

## Setup

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- Supabase account

### Installation
1. Clone this repository
2. Install dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_api_key
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Database Setup
You need to create the following tables in your Supabase project:

#### users
- id (uuid, primary key)
- username (text, unique)
- name (text)
- email (text, unique)
- phone (text)
- password (text)
- profile_picture (text)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

#### todos
- id (uuid, primary key)
- title (text)
- description (text)
- is_completed (boolean)
- priority (integer)
- deadline (timestamp with time zone)
- user_id (uuid, foreign key to users.id)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### Running the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Documentation

### Authentication

#### Register
- **POST** `/api/auth/register`
- **Body**: `{ name, email, phone, username, password, profile_picture }`
- **Response**: `{ message: 'User registered successfully' }`

#### Login
- **POST** `/api/auth/login`
- **Body**: `{ username, password }`
- **Response**: `{ access_token, user: { id, username, name, email } }`

### Todo Operations

#### Get All Todos
- **GET** `/api/todos`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Array of todo objects

#### Get Single Todo
- **GET** `/api/todos/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Todo object

#### Create Todo
- **POST** `/api/todos`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ title, description, deadline, priority }`
- **Response**: `{ message: 'Todo created successfully', todo: {...} }`

#### Update Todo
- **PUT** `/api/todos/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ title, description, is_completed, priority, deadline }`
- **Response**: `{ message: 'Todo updated successfully' }`

#### Delete Todo
- **DELETE** `/api/todos/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ message: 'Todo deleted successfully' }`

### User Operations

#### Get User Profile
- **GET** `/api/users/profile`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ user: {...}, statistics: { totalTodos, completedTodos, efficiency } }`

#### Update User Profile
- **PUT** `/api/users/profile`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ name, email, phone, profile_picture }`
- **Response**: `{ message: 'Profile updated successfully' }`

#### Change Password
- **PUT** `/api/users/change-password`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: `{ currentPassword, newPassword }`
- **Response**: `{ message: 'Password changed successfully' }`

## Telegram Bot Integration

This backend includes integration with Telegram, allowing users to manage their todos through a Telegram bot.

### Bot Setup

1. Create a bot on Telegram by talking to [@BotFather](https://t.me/botfather)
2. Use the `/newbot` command and follow the instructions
3. Copy the API token provided by BotFather
4. Add the token to your `.env` file:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Database Setup for Telegram Integration

Run the necessary SQL scripts from `src/integrations/telegram/setup.sql` in your Supabase SQL editor to create the required tables.

## AI Natural Language Integration

This backend now includes AI-powered natural language processing for managing todos through Telegram.

### AI Setup

1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add the API key to your `.env` file:
```
OPENAI_API_KEY=your_openai_api_key
```

### Using AI in Telegram

1. Link your account with the Telegram bot
2. Type `/ai` to activate AI mode
3. Send natural language requests like "Add buying groceries to my todos" or "Show me all my high priority tasks"

See `AI_FEATURES.md` for more detailed instructions and examples of how to use natural language to manage your todos.

### Setting Webhook (Production)

In production, you need to set up a webhook for your bot:

1. Deploy your application to a server with HTTPS
2. Set the webhook URL using:
```
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url={YOUR_API_URL}/api/telegram/webhook
```

### Local Development

For local development, the bot uses polling mode. Just start your server with:
```bash
npm run dev
```

### User Linking Flow

1. Users start a chat with your Telegram bot
2. The bot provides a linking code
3. Users enter this code in your frontend app
4. The backend verifies the code and links the Telegram chat to the user account

### Available Bot Commands

- `/start` - Start the bot and get a linking code
- `/help` - Show available commands
- `/list` - List all your todos
- `/add <text>` - Add a new todo
- `/done <number>` - Mark a todo as complete
- `/delete <number>` - Delete a todo
- `/show <number>` - Show a specific todo 