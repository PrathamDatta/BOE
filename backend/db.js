const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper for running transactions
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient,
};
