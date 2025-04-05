require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('../src/routes/auth');
const todoRoutes = require('../src/routes/todos');
const userRoutes = require('../src/routes/users');
const telegramRoutes = require('../src/routes/telegram');
const aiRoutes = require('../src/routes/ai');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set');
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_KEY environment variables are not set');
}

// Check for missing environment variables
if(!process.env.JWT_SECRET) console.warn('WARNING: JWT_SECRET is not defined in environment variables');
if(!process.env.SUPABASE_URL) console.warn('WARNING: SUPABASE_URL is not defined in environment variables');
if(!process.env.SUPABASE_KEY) console.warn('WARNING: SUPABASE_KEY is not defined in environment variables');
if(!process.env.OPENAI_API_KEY) console.warn('WARNING: OPENAI_API_KEY is not defined in environment variables');

// Log deployment info
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Telegram bot integration: ${process.env.TELEGRAM_BOT_TOKEN ? 'Enabled' : 'Disabled'}`);
console.log(`AI natural language processing: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
  credentials: true, // Allow cookies
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Test route for quick verification
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working correctly',
    env: process.env.NODE_ENV || 'development',
    telegram_enabled: !!process.env.TELEGRAM_BOT_TOKEN,
    ai_enabled: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Todo API is running',
    version: '1.0.0',
    telegramEnabled: !!process.env.TELEGRAM_BOT_TOKEN
  });
});

// Global error handler - must be after routes
app.use(errorHandler);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.originalUrl,
    method: req.method,
    success: false 
  });
});

// Only start the server if we're not in production (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app; 