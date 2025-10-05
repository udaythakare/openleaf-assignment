/**
 * Simple Bearer token authentication middleware
 * Validates the Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // In production, validate token against database or JWT
  // For now, just check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }

  // Attach token to request for later use
  req.token = token;
  next();
};

module.exports = authenticate;