// Simple test API endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Test API endpoint is working!',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}; 