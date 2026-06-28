import React, { useEffect, useState } from 'react';
import api from '../api';
import MovieCard from '../components/MovieCard';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Home() {
  const [tab, setTab] = useState('movie');
  const [popular, setPopular] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    setPopular([]);
    const endpoint = tab === 'tv' ? '/movies/tv/popular' : '/movies/popular';
    api.get(endpoint).then(r => setPopular(r.data.results || [])).catch(() => {});
  }, [tab]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setSearching(true);
    const endpoint = tab === 'tv'
      ? `/movies/tv/search?query=${encodeURIComponent(debouncedQuery)}`
      : `/movies/search?query=${encodeURIComponent(debouncedQuery)}`;
    api.get(endpoint)
      .then(r => setResults((r.data.results || []).map(item => ({ ...item, media_type: tab }))))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery, tab]);

  const movies = query.trim() ? results : popular.map(m => ({ ...m, media_type: tab }));
  const title = query.trim()
    ? searching ? 'Searching...' : `Results for "${query}"`
    : tab === 'tv' ? 'Popular Series' : 'Popular Movies';

  return (
    <div>
      <div className="tab-bar">
        <button className={`tab-btn${tab === 'movie' ? ' active' : ''}`} onClick={() => { setTab('movie'); setQuery(''); }}>🎬 Movies</button>
        <button className={`tab-btn${tab === 'tv' ? ' active' : ''}`} onClick={() => { setTab('tv'); setQuery(''); }}>📺 Series</button>
      </div>
      <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={tab === 'tv' ? 'Search series...' : 'Search movies...'}
        />
        {query && <button onClick={() => setQuery('')} style={{ background: '#333' }}>Clear</button>}
      </div>
      <h1 className="page-title">{title}</h1>
      {!searching && query.trim() && results.length === 0 && <p className="loading">No results found.</p>}
      <div className="movies-grid">
        {movies.map(m => <MovieCard key={`${m.media_type}-${m.id}`} movie={m} />)}
      </div>
    </div>
  );
}
