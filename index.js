const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/track', async (req, res) => {
  const { brand, qr_id, fingerprint } = req.query;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!brand || !qr_id || !fingerprint) {
    return res.status(400).send('Missing parameters');
  }

  try {
    const brandRes = await pool.query('SELECT * FROM brands WHERE name = $1', [brand]);
    if (brandRes.rowCount === 0) return res.status(404).send('Brand not found');

    const brandData = brandRes.rows[0];

    const existing = await pool.query(
      `SELECT * FROM scans WHERE fingerprint = $1 AND qr_id = $2`,
      [fingerprint, qr_id]
    );

    if (existing.rowCount === 0) {
      await pool.query(
        `INSERT INTO scans (brand_id, qr_id, fingerprint, ip_address) VALUES ($1, $2, $3, $4)`,
        [brandData.id, qr_id, fingerprint, ip]
      );
    }

    res.redirect(brandData.redirect_url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
app.get('/', (req, res) => {
  res.send('QR Tracker backend is running!');
});


app.listen(port, () => console.log(`Server running on port ${port}`));
