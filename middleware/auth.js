const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
  try {
    // Get the token from the request header
    const token = req.header('Authorization');

    // Check if the token is missing
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed. Token missing.' });
    }

    // Verify the token
    const decodedToken = jwt.verify(token.replace('Bearer ', ''), config.jwtSecret);
    
    // Attach the user ID to the request for later use
    req.userId = decodedToken.userId;

    // Continue to the protected route
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed. Token invalid.' });
  }
};

module.exports = authMiddleware;
