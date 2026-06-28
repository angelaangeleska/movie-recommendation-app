import React, { useEffect, useState } from 'react';
import api from '../api';
import MovieCard from '../components/MovieCard';

export default function Recommendations() {
  const [tab, setTab] = useState('movie');
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const base = userId ? `/recommendations?user_id=${userId}` : '/recommendations/trending';
    api.get(`${base}${userId ? '&media_type=movie' : '?media_type=movie'}`)
      .then(r => setMovies(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {})
      .finally(() => setLoadingMovies(false));

    api.get(`${base}${userId ? '&media_type=tv' : '?media_type=tv'}`)
      .then(r => setSeries(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {})
      .finally(() => setLoadingSeries(false));
  }, []);

  const items = tab === 'tv' ? series : movies;
  const loading = tab === 'tv' ? loadingSeries : loadingMovies;

  return (
    <div>
      <h1 className="page-title">Recommended For You</h1>
      <div className="tab-bar">
        <button className={`tab-btn${tab === 'movie' ? ' active' : ''}`} onClick={() => setTab('movie')}>🎬 Movies</button>
        <button className={`tab-btn${tab === 'tv' ? ' active' : ''}`} onClick={() => setTab('tv')}>📺 Series</button>
      </div>
      {loading && <p className="loading">Loading recommendations...</p>}
      {!loading && items.length === 0 && (
        <p className="loading">No recommendations yet. Add some favorites to get started!</p>
      )}
      <div className="movies-grid">
        {items.map(m => <MovieCard key={`${m.media_type || tab}-${m.id}`} movie={{ ...m, media_type: m.media_type || tab }} />)}
      </div>
    </div>
  );
}
