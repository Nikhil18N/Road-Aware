const { supabase } = require('../config/supabase');

/**
 * Middleware to authenticate requests using Supabase Auth
 * @param {boolean} optional - If true, continues even if no token is provided
 */
const authenticate = (optional = false) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      if (optional) return next();
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (optional) return next();
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    if (optional) return next();
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

/**
 * Middleware to check for specific roles
 * Assumes authenticate middleware has run and req.user is set
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles = []) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Check role from user metadata (or DB profile if stricter check needed)
    // For now, we trust metadata populated by our triggers/logic
    const userRole = req.user.user_metadata.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }

    next();
  } catch (error) {
    console.error('Role Check Error:', error);
    res.status(500).json({ error: 'Internal server error during authorization' });
  }
};

module.exports = {
  authenticate,
  authorize
};
