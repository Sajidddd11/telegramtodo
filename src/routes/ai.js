/**
 * AI integration routes
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const aiClient = require('../integrations/openai/aiClient');
const aiTools = require('../integrations/openai/aiTools');

// Apply auth middleware to all AI routes
router.use(authMiddleware);

/**
 * Simulate AI natural language processing
 * This endpoint is primarily for testing the AI integration outside of Telegram
 */
router.post('/simulate', async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Check if OpenAI is initialized
    if (!aiClient.getOpenAIClient()) {
      return res.status(503).json({ 
        error: 'AI service is not available',
        details: 'The OpenAI client is not initialized. Check your API key.'
      });
    }
    
    // Process the message
    const response = await aiClient.processNaturalLanguageRequest(
      userId,
      message,
      aiTools
    );
    
    // Return the response
    res.json({ response });
  } catch (error) {
    console.error('Error simulating AI:', error);
    res.status(500).json({ 
      error: 'Error processing AI request',
      details: error.message 
    });
  }
});

/**
 * Get AI status
 */
router.get('/status', (req, res) => {
  const aiEnabled = !!aiClient.getOpenAIClient();
  
  res.json({
    enabled: aiEnabled,
    openai_configured: !!process.env.OPENAI_API_KEY
  });
});

module.exports = router; 