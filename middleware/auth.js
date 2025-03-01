require("dotenv").config();
const jwt = require('jsonwebtoken');
const dbUtils = require('../db/utils');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists in database
    const user = await dbUtils.getUserByEmail(decoded.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Set user info in request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = auth; 