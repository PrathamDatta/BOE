const db = require('./db');

async function run() {
  try {
    // Check what companies exist
    const { rows } = await db.query('SELECT * FROM companies ORDER BY id ASC');
    if (rows.length === 0) {
      console.log('No companies found, seeding new companies...');
      await db.query(`
        INSERT INTO companies (name) VALUES ('NISS'), ('New Interport'), ('S&S Clearing') 
        ON CONFLICT (name) DO NOTHING
      `);
    } else {
      console.log('Existing companies found, updating their names...');
      // Update the first up to 3 companies
      const newNames = ['NISS', 'New Interport', 'S&S Clearing'];
      for (let i = 0; i < Math.min(rows.length, newNames.length); i++) {
        await db.query('UPDATE companies SET name = $1 WHERE id = $2', [newNames[i], rows[i].id]);
      }
      
      // If there were less than 3, insert the remaining ones
      if (rows.length < newNames.length) {
        for (let i = rows.length; i < newNames.length; i++) {
           await db.query('INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [newNames[i]]);
        }
      }
    }
    console.log('Update successful!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
