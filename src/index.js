require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const userRoutes = require('./routes/users');
const telegramRoutes = require('./routes/telegram');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes with /api prefix to match deployed version
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/telegram', telegramRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Todo API is running',
    version: '1.0.0',
    telegramEnabled: !!process.env.TELEGRAM_BOT_TOKEN
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Telegram bot integration: ${process.env.TELEGRAM_BOT_TOKEN ? 'Enabled' : 'Disabled'}`);
}); 