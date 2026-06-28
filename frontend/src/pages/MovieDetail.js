import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inFav, setInFav] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/movies/${id}`),
      api.get('/users/favorites'),
    ]).then(([movieRes, favRes]) => {
      setMovie(movieRes.data);
      setInFav(favRes.data.some(f => f.movie_id === parseInt(id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function toggleFav() {
    if (!movie) return;
    if (inFav) {
      await api.delete(`/users/favorites/${id}`);
      setInFav(false);
      setMsg('Removed from favorites');
    } else {
      await api.post('/users/favorites', {
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster_path,
        genre_ids: movie.genres?.map(g => g.id) || [],
      });
      setInFav(true);
      setMsg('Added to favorites!');
    }
    setTimeout(() => setMsg(''), 2000);
  }

  if (loading) return <p className="loading">Loading...</p>;
  if (!movie) return <p className="loading">Movie not found.</p>;

  const poster = movie.poster_path
    ? `${POSTER_BASE}${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <div className="movie-detail">
      <img src={poster} alt={movie.title} />
      <div className="movie-detail-info">
        <h1>{movie.title}</h1>
        <p className="movie-detail-meta">
          {movie.release_date?.slice(0, 4)} &nbsp;·&nbsp; ★ {movie.vote_average?.toFixed(1)}
          &nbsp;·&nbsp; {movie.genres?.map(g => g.name).join(', ')}
        </p>
        <p className="movie-detail-overview">{movie.overview}</p>
        <button className={`btn-fav${inFav ? ' added' : ''}`} onClick={toggleFav}>
          {inFav ? '✓ In Favorites' : '+ Add to Favorites'}
        </button>
        {msg && <p style={{ marginTop: '0.75rem', color: '#f5c518' }}>{msg}</p>}
      </div>
    </div>
  );
}
