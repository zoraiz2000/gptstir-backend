const { Pool } = require('pg');
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const resetDatabase = async () => {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Database reset successfully!');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    await pool.end();
  }
};

resetDatabase().catch(console.error); 