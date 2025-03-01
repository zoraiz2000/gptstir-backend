const allowCors = require('../../middleware');
const express = require('express');
const router = express.Router();

// We'll need to create a mini-app for handling this route
const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/', async (req, res) => {
  try {
    // Log the request for debugging
    console.log('Received Google auth request:', req.body.credential ? 'Has credential token' : 'No credential');
    
    // Here we would normally use the routes/auth.js file's logic
    // For now, we'll just simulate the forwarding to demonstrate CORS works
    
    // Forward the request to your existing auth route handler
    // This requires a refactor of your routes/auth.js to export a function
    // that can be called directly
    
    // For now, just return a success response for testing
    res.status(200).json({
      success: true,
      message: 'Google auth route is working properly',
      user: { id: 'test-user', email: 'test@example.com' },
      token: 'test-token'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Wrap the Express app with our CORS middleware
module.exports = allowCors(app); 