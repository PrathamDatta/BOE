const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Reading schema...');
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    
    console.log('Injecting schema into Neon Database...');
    await pool.query(schema);
    
    console.log('Seeding initial companies...');
    await pool.query(`INSERT INTO companies (name) VALUES ('NISS'), ('New Interport'), ('S&S Clearing') ON CONFLICT DO NOTHING;`);
    
    console.log('Database fully initialized and seeded! Ready for production.');
  } catch(err) {
    console.error('Error initializing DB:', err);
  } finally {
    process.exit();
  }
}
run();
