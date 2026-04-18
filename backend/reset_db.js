const db = require('./db');

async function run() {
  try {
    console.log('Truncating BOE tables to reset values...');
    // CASCADE is used in case there are foreign key restrictions
    await db.query(`TRUNCATE TABLE boes, stage2_charges, stage3_storage, stage4_invoices CASCADE;`);
    console.log('Successfully wiped old BOE data. Companies remain intact.');
  } catch (err) {
    if (err.code === '42P01') {
      console.log('Tables do not exist yet, skipping truncation.');
    } else {
      console.error('Error truncating tables:', err);
    }
  } finally {
    process.exit(0);
  }
}

run();
