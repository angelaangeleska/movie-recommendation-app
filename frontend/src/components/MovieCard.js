import React from 'react';
import { Link } from 'react-router-dom';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export default function MovieCard({ movie }) {
  const title = movie.title || movie.name || 'Untitled';
  const poster = movie.poster_path
    ? `${POSTER_BASE}${movie.poster_path}`
    : 'https://via.placeholder.com/342x513?text=No+Image';
  const mediaType = movie.media_type || 'movie';
  const to = mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;

  return (
    <Link to={to} className="movie-card">
      <img src={poster} alt={title} loading="lazy" />
      <div className="movie-card-info">
        <div className="movie-card-title">{title}</div>
        <div className="movie-card-rating">★ {movie.vote_average?.toFixed(1) || 'N/A'}</div>
      </div>
    </Link>
  );
}
