const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const { rows } = await pool.query('SELECT * FROM companies');
    console.log('Companies found:', rows);
    if (rows.length === 0) {
      console.log('Database is completely empty! Seeding now...');
      await pool.query(`INSERT INTO companies (name) VALUES ('NISS'), ('New Interport'), ('S&S Clearing')`);
      console.log('Successfully seeded companies into the cloud Database!');
    }
  } catch(err) {
    console.error('Error connecting to DB:', err);
  } finally {
    process.exit();
  }
}
run();
