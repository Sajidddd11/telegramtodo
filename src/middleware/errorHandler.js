// Global error handler middleware for better serverless error management
const errorHandler = (err, req, res, next) => {
  console.error('Error caught by global handler:', err);
  
  // Set appropriate status code (default to 500 if not set)
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Return error response
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred',
    success: false,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler; 