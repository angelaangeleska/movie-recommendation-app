const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

router.get('/favorites/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM favorites WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/preferences/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT genre_ids FROM user_preferences WHERE user_id = $1', [req.params.userId]);
    res.json({ genre_ids: result.rows[0]?.genre_ids || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user_id: payload.userId, email: payload.email });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
