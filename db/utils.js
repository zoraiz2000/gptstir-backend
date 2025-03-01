require("dotenv").config();
const pool = require('./connection');
const jwt = require('jsonwebtoken');

const dbUtils = {
  // User related functions
  async getUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      throw new Error('Database error while fetching user');
    }
  },

  async createUser({ email, name }) {
    try {
      const result = await pool.query(
        'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
        [email, name]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw new Error('Database error while creating user');
    }
  },

  // Conversation related functions
  async createConversation(userId, title) {
    try {
      const result = await pool.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *',
        [userId, title]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in createConversation:', error);
      throw new Error('Database error while creating conversation');
    }
  },

  async getConversation(conversationId) {
    try {
      const result = await pool.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in getConversation:', error);
      throw new Error('Database error while fetching conversation');
    }
  },

  // Message related functions
  async storeMessage(conversationId, role, content, modelType, modelName) {
    try {
      const result = await pool.query(
        'INSERT INTO messages (conversation_id, role, content, model_type, model_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [conversationId, role, content, modelType, modelName]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in storeMessage:', error);
      throw new Error('Database error while storing message');
    }
  },

  async getConversationMessages(conversationId) {
    try {
      const result = await pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      throw new Error('Database error while fetching messages');
    }
  },

  async getUserConversations(userId) {
    try {
      const result = await pool.query(`
        SELECT 
          c.*,
          m.content as last_message,
          m.model_name as last_model_name
        FROM conversations c
        LEFT JOIN (
          SELECT DISTINCT ON (conversation_id) 
            conversation_id,
            content,
            model_name,
            created_at
          FROM messages 
          ORDER BY conversation_id, created_at DESC
        ) m ON m.conversation_id = c.id
        WHERE c.user_id = $1
        ORDER BY c.updated_at DESC
      `, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      throw new Error('Database error while fetching conversations');
    }
  },

  async updateConversationTimestamp(conversationId) {
    try {
      await pool.query(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );
    } catch (error) {
      console.error('Error in updateConversationTimestamp:', error);
      throw new Error('Database error while updating timestamp');
    }
  },

  async deleteConversation(conversationId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING *',
        [conversationId, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      throw new Error('Database error while deleting conversation');
    }
  },

  async renameConversation(conversationId, userId, newTitle) {
    try {
      const result = await pool.query(
        'UPDATE conversations SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [newTitle, conversationId, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in renameConversation:', error);
      throw new Error('Database error while renaming conversation');
    }
  },

  async findOrCreateUser(googleUser) {
    const { sub: googleId, email, name } = googleUser;
    
    // Try to find existing user
    let result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );
    
    let user = result.rows[0];
    
    if (!user) {
      // Create new user
      result = await pool.query(
        'INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) RETURNING *',
        [name, email, googleId]
      );
      user = result.rows[0];
    } else if (!user.google_id) {
      // Update existing user with Google ID
      result = await pool.query(
        'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
        [googleId, user.id]
      );
      user = result.rows[0];
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  }
};

module.exports = dbUtils; 