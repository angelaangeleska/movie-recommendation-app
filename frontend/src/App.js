import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import TVDetail from './pages/TVDetail';
import Recommendations from './pages/Recommendations';
import Favorites from './pages/Favorites';
import './App.css';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  }
  if (!token) return null;
  return (
    <nav className="navbar">
      <Link to="/home" className="nav-brand">🎬 MovieRec</Link>
      <div className="nav-links">
        <Link to="/home">Movies</Link>
        <Link to="/recommendations">For You</Link>
        <Link to="/favorites">Favorites</Link>
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/movie/:id" element={<PrivateRoute><MovieDetail /></PrivateRoute>} />
          <Route path="/tv/:id" element={<PrivateRoute><TVDetail /></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
