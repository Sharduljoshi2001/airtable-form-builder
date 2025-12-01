const User = require('../models/User');

// Middleware - Check if user is authenticated
function requireAuth(req, res, next) {
  // Session check karo
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      redirectTo: '/auth/airtable'
    });
  }
  
  // Next middleware ya route pe bhej do
  next();
}

// Middleware - Get current user info and add to request
async function getCurrentUser(req, res, next) {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.currentUser = user;
      }
    }
    next();
  } catch (error) {
    console.error('❌ Get current user error:', error);
    next(); // Continue even if user fetch fails
  }
}

module.exports = {
  requireAuth,
  getCurrentUser
};
