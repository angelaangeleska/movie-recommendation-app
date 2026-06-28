import os
import time
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Catalog Service", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"

_cache: dict = {}
CACHE_TTL = 300


def _cached(key: str):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None


def _store(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}
    return data


async def tmdb_get(path: str, params: dict = None):
    if params is None:
        params = {}
    params["api_key"] = TMDB_API_KEY
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{TMDB_BASE}{path}", params=params, timeout=10)
        r.raise_for_status()
        return r.json()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "catalog-service"}


# ── Movies ────────────────────────────────────────────────────────────────────

@app.get("/movies/health")
async def movies_health():
    return {"status": "ok", "service": "catalog-service"}


@app.get("/movies/genres")
async def get_movie_genres():
    cached = _cached("movie_genres")
    if cached:
        return cached
    data = await tmdb_get("/genre/movie/list")
    return _store("movie_genres", data)


@app.get("/movies/popular")
async def get_popular(page: int = 1):
    key = f"popular:{page}"
    cached = _cached(key)
    if cached:
        return cached
    data = await tmdb_get("/movie/popular", {"page": page})
    return _store(key, data)


@app.get("/movies/search")
async def search_movies(query: str = Query(...), page: int = 1):
    key = f"search_movie:{query}:{page}"
    cached = _cached(key)
    if cached:
        return cached
    data = await tmdb_get("/search/movie", {"query": query, "page": page})
    return _store(key, data)


@app.get("/movies/{movie_id}")
async def get_movie(movie_id: int):
    key = f"movie:{movie_id}"
    cached = _cached(key)
    if cached:
        return cached
    data = await tmdb_get(f"/movie/{movie_id}")
    return _store(key, data)


# ── TV Series ─────────────────────────────────────────────────────────────────

@app.get("/tv/genres")
async def get_tv_genres():
    cached = _cached("tv_genres")
    if cached:
        return cached
    data = await tmdb_get("/genre/tv/list")
    return _store("tv_genres", data)


@app.get("/tv/popular")
async def get_tv_popular(page: int = 1):
    key = f"tv_popular:{page}"
    cached = _cached(key)
    if cached:
        return cached
    data = await tmdb_get("/tv/popular", {"page": page})
    return _store(key, data)


@app.get("/tv/search")
async def search_tv(query: str = Query(...), page: int = 1):
    key = f"search_tv:{query}:{page}"
    cached = _cached(key)
    if cached:
        return cached
    data = await tmdb_get("/search/tv", {"query": query, "page": page})
    return _store(key, data)


@app.get("/tv/{tv_id}")
async def get_tv(tv_id: int):
    key = f"tv:{tv_id}"
    cached = _cached(key)
    if cached:
        return cached
    data = await tmdb_get(f"/tv/{tv_id}")
    return _store(key, data)
