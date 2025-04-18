const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Debug request info
    console.log('=== Auth Request Info ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Origin:', req.headers.origin);
    console.log('Host:', req.headers.host);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided, authorization denied',
        success: false 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'None');

    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid token format', 
        success: false 
      });
    }

    try {
      // Verify token
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ 
          error: 'Internal server configuration error',
          success: false 
        });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully. User ID:', decoded.user?.id);
      
      // Add user info to request
      req.user = decoded;
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      return res.status(401).json({ 
        error: 'Token is not valid', 
        success: false 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Server error during authentication', 
      success: false 
    });
  }
};

module.exports = authMiddleware; 