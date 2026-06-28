const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        genre_ids INTEGER[] DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL,
        movie_title VARCHAR(500) NOT NULL,
        movie_poster VARCHAR(500),
        genre_ids INTEGER[] DEFAULT '{}',
        media_type VARCHAR(10) DEFAULT 'movie',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, movie_id, media_type)
      );
    `);
    await client.query(`
      ALTER TABLE favorites ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'movie';
    `);
    await client.query(`
      ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_user_id_movie_id_key;
    `);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'favorites_user_id_movie_id_media_type_key'
        ) THEN
          ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_movie_id_media_type_key
            UNIQUE (user_id, movie_id, media_type);
        END IF;
      END $$;
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
