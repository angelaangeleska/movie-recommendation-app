const router = require('express').Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.userId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/preferences', authenticate, async (req, res) => {
  const { genre_ids } = req.body;
  if (!Array.isArray(genre_ids)) return res.status(400).json({ error: 'genre_ids must be an array' });
  try {
    await pool.query(
      `INSERT INTO user_preferences (user_id, genre_ids, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET genre_ids = $2, updated_at = NOW()`,
      [req.userId, genre_ids]
    );
    res.json({ genre_ids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/preferences', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT genre_ids FROM user_preferences WHERE user_id = $1', [req.userId]);
    res.json({ genre_ids: result.rows[0]?.genre_ids || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/favorites', authenticate, async (req, res) => {
  const { movie_id, movie_title, movie_poster, genre_ids, media_type = 'movie' } = req.body;
  if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
  try {
    const result = await pool.query(
      `INSERT INTO favorites (user_id, movie_id, movie_title, movie_poster, genre_ids, media_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ON CONSTRAINT favorites_user_id_movie_id_media_type_key DO NOTHING
       RETURNING *`,
      [req.userId, movie_id, movie_title, movie_poster || null, genre_ids || [], media_type]
    );
    res.status(201).json(result.rows[0] || { message: 'Already in favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/favorites', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/favorites/:movieId', authenticate, async (req, res) => {
  const { media_type = 'movie' } = req.query;
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND movie_id = $2 AND media_type = $3', [req.userId, req.params.movieId, media_type]);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
