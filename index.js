import express from 'express';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase SSL
  }
});

// Root route for Render health check
app.get('/', (req, res) => {
  res.send('QR Tracker backend is running!');
});

// Example tracking endpoint
app.get('/track', async (req, res) => {
  const { brand, qr_id, fingerprint } = req.query;

  if (!brand || !qr_id || !fingerprint) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM scans WHERE brand = $1 AND qr_id = $2 AND fingerprint = $3',
      [brand, qr_id, fingerprint]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO scans (brand, qr_id, fingerprint) VALUES ($1, $2, $3)',
        [brand, qr_id, fingerprint]
      );
    }

    res.redirect(`https://${brand}.com`); // Or your real brand URL
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
