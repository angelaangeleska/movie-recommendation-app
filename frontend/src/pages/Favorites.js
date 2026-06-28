import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('movie');

  useEffect(() => {
    api.get('/users/favorites').then(r => {
      setFavorites(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function remove(movieId, mediaType) {
    await api.delete(`/users/favorites/${movieId}?media_type=${mediaType}`);
    setFavorites(prev => prev.filter(f => !(f.movie_id === movieId && f.media_type === mediaType)));
  }

  if (loading) return <p className="loading">Loading...</p>;

  const filtered = favorites.filter(f => (f.media_type || 'movie') === tab);

  return (
    <div>
      <h1 className="page-title">My Favorites</h1>
      <div className="tab-bar">
        <button className={`tab-btn${tab === 'movie' ? ' active' : ''}`} onClick={() => setTab('movie')}>🎬 Movies</button>
        <button className={`tab-btn${tab === 'tv' ? ' active' : ''}`} onClick={() => setTab('tv')}>📺 Series</button>
      </div>
      {filtered.length === 0 && <p className="loading">No {tab === 'tv' ? 'series' : 'movies'} in favorites yet.</p>}
      <div className="movies-grid">
        {filtered.map(fav => {
          const mediaType = fav.media_type || 'movie';
          const to = mediaType === 'tv' ? `/tv/${fav.movie_id}` : `/movie/${fav.movie_id}`;
          return (
            <div key={`${mediaType}-${fav.id}`} className="movie-card" style={{ display: 'block' }}>
              <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
                <img
                  src={fav.movie_poster ? `${POSTER_BASE}${fav.movie_poster}` : 'https://via.placeholder.com/342x513?text=No+Image'}
                  alt={fav.movie_title}
                />
                <div className="movie-card-info">
                  <div className="movie-card-title">{fav.movie_title}</div>
                </div>
              </Link>
              <div style={{ padding: '0 0.6rem 0.6rem' }}>
                <button className="fav-remove" onClick={() => remove(fav.movie_id, mediaType)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
