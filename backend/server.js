const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Ensure uploads dir exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// ----------------------------------------------------
// COMPANIES API
// ----------------------------------------------------
app.get('/api/companies', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM companies ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ 
      error: err.message || 'Unknown database error', 
      details: err.toString(),
      isDbUrlSet: !!process.env.DATABASE_URL 
    });
  }
});

app.post('/api/companies/seed', async (req, res) => {
  try {
    await db.query(`
      INSERT INTO companies (name) VALUES ('NISS'), ('New Interport'), ('S&S Clearing') 
      ON CONFLICT (name) DO NOTHING
    `);
    res.json({ message: 'Companies seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CSV UPLOAD API
// ----------------------------------------------------
app.post('/api/upload/csv', upload.single('file'), (req, res) => {
  const { company_id, stage } = req.body;
  
  if (!company_id || !stage || !req.file) {
    return res.status(400).json({ error: 'Missing company_id, stage, or file' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let client;
      try {
        client = await db.getClient();
        await client.query('BEGIN');
        
        const skippedBOEs = [];
        let imported = 0;

        for (const row of results) {
          const boe_number = row.boe_number || row.BOE || row.boe;
          if (!boe_number) continue;

          if (stage === '1') {
            const hawb = row.hawb || row.HAWB || '';
            await client.query(
              `INSERT INTO boes (company_id, boe_number, hawb) VALUES ($1, $2, $3)
               ON CONFLICT (company_id, boe_number) DO NOTHING`,
              [company_id, boe_number, hawb]
            );
            imported++;
          } else {
            // Stages 2, 3, 4 require BOE to exist
            const boeRes = await client.query(
              `SELECT id FROM boes WHERE company_id = $1 AND boe_number = $2`,
              [company_id, boe_number]
            );

            if (boeRes.rows.length === 0) {
              skippedBOEs.push(boe_number);
              continue;
            }

            const boe_id = boeRes.rows[0].id;
            
            if (stage === '2') {
              const do_charge = parseFloat(row.do_charge || row.do || row.DO || 0);
              const duty_charge = parseFloat(row.duty_charge || row.duty || row.Duty || 0);
              
              await client.query(
                `INSERT INTO stage2_charges (company_id, boe_id, do_charge, duty_charge) VALUES ($1, $2, $3, $4)`,
                [company_id, boe_id, do_charge, duty_charge]
              );
              imported++;
            } else if (stage === '3') {
              const storage_charge = parseFloat(row.storage_charge || row.storage || row.Storage || 0);
              await client.query(
                `INSERT INTO stage3_storage (company_id, boe_id, storage_charge) VALUES ($1, $2, $3)`,
                [company_id, boe_id, storage_charge]
              );
               imported++;
            } else if (stage === '4') {
              const inv_do = parseFloat(row.invoiced_do || row.do_charge || row.DO || 0);
              const inv_duty = parseFloat(row.invoiced_duty || row.duty_charge || row.Duty || 0);
              const inv_storage = parseFloat(row.invoiced_storage || row.storage_charge || row.Storage || 0);
              await client.query(
                `INSERT INTO stage4_invoices (company_id, boe_id, do_charge, duty_charge, storage_charge) VALUES ($1, $2, $3, $4, $5)`,
                [company_id, boe_id, inv_do, inv_duty, inv_storage]
              );
               imported++;
            }
          }
        }
        
        // After upload, update statuses based on reconciliation results
        await updateStatuses(client, company_id);

        await client.query('COMMIT');
        res.json({ message: 'Success', imported, skippedBOEs, stage });
      } catch (err) {
        if(client) await client.query('ROLLBACK');
        console.error('Upload Error: ', err);
        res.status(500).json({ error: 'Database processing failed', details: err.message });
      } finally {
        if(client) client.release();
        fs.unlinkSync(req.file.path);
      }
    });
});

async function updateStatuses(client, company_id) {
  // Finds discrepancies and marks statuses appropriately for all Pending or Discrepancy BOEs
  const reconciliations = await client.query(`
     SELECT boe_id, status, do_mismatch, duty_mismatch, storage_mismatch 
     FROM boe_reconciliation_view 
     WHERE company_id = $1 AND status != 'Paid'
  `, [company_id]);

  for (const rec of reconciliations.rows) {
     const hasMismatch = Math.abs(parseFloat(rec.do_mismatch)) > 0.01 || 
                         Math.abs(parseFloat(rec.duty_mismatch)) > 0.01 || 
                         Math.abs(parseFloat(rec.storage_mismatch)) > 0.01;
     
     const newStatus = hasMismatch ? 'Discrepancy' : 'Invoiced';
     
     if (rec.status !== newStatus && rec.status !== 'Paid') {
        await client.query(`UPDATE boes SET status = $1 WHERE id = $2`, [newStatus, rec.boe_id]);
     }
  }
}

// ----------------------------------------------------
// RECONCILIATION API
// ----------------------------------------------------
app.get('/api/reconciliation', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id required' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM boe_reconciliation_view WHERE company_id = $1 ORDER BY created_at DESC',
      [company_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DASHBOARD API
// ----------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: 'company_id required' });

  try {
    const metricsRes = await db.query(`
      SELECT 
        COUNT(boe_id) as total_boes,
        SUM(CASE WHEN status = 'Discrepancy' THEN 1 ELSE 0 END) as discrepancy_count,
        SUM(do_mismatch + duty_mismatch + storage_mismatch) as total_leakage,
        SUM(recorded_do + recorded_duty + recorded_storage) as total_recorded,
        SUM(invoiced_do + invoiced_duty + invoiced_storage) as total_invoiced
      FROM boe_reconciliation_view 
      WHERE company_id = $1
    `, [company_id]);

    const statusChartRes = await db.query(`
      SELECT status as name, COUNT(*) as value 
      FROM boes 
      WHERE company_id = $1 
      GROUP BY status
    `, [company_id]);

    res.json({
        metrics: metricsRes.rows[0],
        statusChart: statusChartRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// MANUAL STATUS UPDATE
// ----------------------------------------------------
app.put('/api/boes/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, company_id } = req.body;

  try {
    await db.query(`UPDATE boes SET status = $1 WHERE id = $2 AND company_id = $3`, [status, id, company_id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
