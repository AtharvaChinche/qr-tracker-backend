import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get('/track', async (req, res) => {
  const { qr_id, fingerprint, redirect } = req.query;

  if (!qr_id || !fingerprint || !redirect) {
    return res.status(400).send('Missing required parameters: qr_id, fingerprint, redirect');
  }

  try {
    // Check if this device already scanned this QR
    const existingScan = await pool.query(
      'SELECT * FROM scans WHERE qr_id = $1 AND fingerprint = $2',
      [qr_id, fingerprint]
    );

    if (existingScan.rows.length === 0) {
      // Insert new scan record
      await pool.query(
        'INSERT INTO scans (qr_id, fingerprint) VALUES ($1, $2)',
        [qr_id, fingerprint]
      );
    }

    // Redirect user to the brand website URL
    res.redirect(redirect);
  } catch (error) {
    console.error('Error tracking scan:', error);
    res.status(500).send('Internal server error');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`QR Tracker backend is running on port ${PORT}`);
});
