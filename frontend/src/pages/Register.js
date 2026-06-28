import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/movies/genres'), api.get('/movies/tv/genres')])
      .then(([movieRes, tvRes]) => {
        const movieGenres = movieRes.data.genres || [];
        const tvGenres = tvRes.data.genres || [];
        const merged = [...movieGenres];
        tvGenres.forEach(g => { if (!merged.find(m => m.id === g.id)) merged.push(g); });
        setGenres(merged.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {});
  }, []);

  function toggleGenre(id) {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      if (selectedGenres.length > 0) {
        await api.put('/users/preferences', { genre_ids: selectedGenres });
      }
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="auth-page">
      <h1>Create Account</h1>
      {error && <p className="error-msg">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        {genres.length > 0 && (
          <div className="form-group">
            <label>Favorite Genres (optional)</label>
            <div className="genres-grid">
              {genres.map(g => (
                <label key={g.id} className="genre-checkbox">
                  <input type="checkbox" checked={selectedGenres.includes(g.id)} onChange={() => toggleGenre(g.id)} />
                  {g.name}
                </label>
              ))}
            </div>
          </div>
        )}
        <button className="btn-primary" type="submit">Register</button>
      </form>
      <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
