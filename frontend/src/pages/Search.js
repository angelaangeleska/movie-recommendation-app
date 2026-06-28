import React, { useState } from 'react';
import api from '../api';
import MovieCard from '../components/MovieCard';

export default function Search() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await api.get(`/movies/search?query=${encodeURIComponent(query)}`);
      setMovies(r.data.results || []);
    } catch {}
    setLoading(false);
    setSearched(true);
  }

  return (
    <div>
      <h1 className="page-title">Search Movies</h1>
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for a movie..."
        />
        <button type="submit">Search</button>
      </form>
      {loading && <p className="loading">Searching...</p>}
      {searched && !loading && movies.length === 0 && <p className="loading">No results found.</p>}
      <div className="movies-grid">
        {movies.map(m => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
