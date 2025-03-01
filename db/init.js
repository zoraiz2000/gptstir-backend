const { Pool } = require('pg');

const createPool = (database) => new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database,
  ssl: { rejectUnauthorized: false }
});

const initializeDatabase = async () => {
  const defaultPool = createPool('postgres');

  try {
    // Create database if it doesn't exist
    await defaultPool.query(`
      CREATE DATABASE llm_chat_db;
    `);
  } catch (err) {
    if (err.code !== '42P04') { // Error code for "database already exists"
      console.error('Error creating database:', err);
      throw err;
    }
  } finally {
    await defaultPool.end();
  }

  // Connect to the new database
  const dbPool = createPool(process.env.DB_NAME);

  try {
    // Create tables with proper constraints and indices
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        model_type VARCHAR(50),
        model_name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);

    console.log('Database initialized successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  } finally {
    await dbPool.end();
  }
};

initializeDatabase().catch(console.error);

module.exports = initializeDatabase; 