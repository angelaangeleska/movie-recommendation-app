import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export default function TVDetail() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inFav, setInFav] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/movies/tv/${id}`),
      api.get('/users/favorites'),
    ]).then(([showRes, favRes]) => {
      setShow(showRes.data);
      setInFav(favRes.data.some(f => f.movie_id === parseInt(id) && f.media_type === 'tv'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function toggleFav() {
    if (!show) return;
    if (inFav) {
      await api.delete(`/users/favorites/${id}?media_type=tv`);
      setInFav(false);
      setMsg('Removed from favorites');
    } else {
      await api.post('/users/favorites', {
        movie_id: show.id,
        movie_title: show.name,
        movie_poster: show.poster_path,
        genre_ids: show.genres?.map(g => g.id) || [],
        media_type: 'tv',
      });
      setInFav(true);
      setMsg('Added to favorites!');
    }
    setTimeout(() => setMsg(''), 2000);
  }

  if (loading) return <p className="loading">Loading...</p>;
  if (!show) return <p className="loading">Series not found.</p>;

  const poster = show.poster_path
    ? `${POSTER_BASE}${show.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <div className="movie-detail">
      <img src={poster} alt={show.name} />
      <div className="movie-detail-info">
        <h1>{show.name}</h1>
        <p className="movie-detail-meta">
          {show.first_air_date?.slice(0, 4)} &nbsp;·&nbsp; ★ {show.vote_average?.toFixed(1)}
          &nbsp;·&nbsp; {show.number_of_seasons} season{show.number_of_seasons !== 1 ? 's' : ''}
          &nbsp;·&nbsp; {show.genres?.map(g => g.name).join(', ')}
        </p>
        <p className="movie-detail-overview">{show.overview}</p>
        <button className={`btn-fav${inFav ? ' added' : ''}`} onClick={toggleFav}>
          {inFav ? '✓ In Favorites' : '+ Add to Favorites'}
        </button>
        {msg && <p style={{ marginTop: '0.75rem', color: '#f5c518' }}>{msg}</p>}
      </div>
    </div>
  );
}
