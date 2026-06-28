import os
from collections import Counter
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Recommendation Service", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:3001")


async def tmdb_get(path: str, params: dict = None):
    if params is None:
        params = {}
    params["api_key"] = TMDB_API_KEY
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{TMDB_BASE}{path}", params=params, timeout=10)
        r.raise_for_status()
        return r.json()


async def user_get(path: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{USER_SERVICE_URL}{path}", timeout=10)
        r.raise_for_status()
        return r.json()


def _normalize(item: dict, media_type: str) -> dict:
    """Normalize TMDB movie/tv fields to common keys."""
    return {
        **item,
        "title": item.get("title") or item.get("name", ""),
        "release_date": item.get("release_date") or item.get("first_air_date", ""),
        "media_type": media_type,
    }


async def _build_recommendations(user_id: int, media_type: str) -> list:
    try:
        preferences = await user_get(f"/internal/preferences/{user_id}")
        favorites = await user_get(f"/internal/favorites/{user_id}")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"User service error: {str(e)}")

    typed_favs = [f for f in favorites if f.get("media_type", "movie") == media_type]
    fav_ids = {f["movie_id"] for f in typed_favs}

    pref_genres: list = preferences.get("genre_ids", [])
    genre_counter: Counter = Counter(pref_genres)
    for fav in typed_favs:
        for gid in (fav.get("genre_ids") or []):
            genre_counter[gid] += 1

    # Fetch genres from TMDB if stored genre_ids are empty
    if not genre_counter and typed_favs:
        tmdb_path = "movie" if media_type == "movie" else "tv"
        async with httpx.AsyncClient() as client:
            for fav in typed_favs[:5]:
                try:
                    r = await client.get(
                        f"{TMDB_BASE}/{tmdb_path}/{fav['movie_id']}",
                        params={"api_key": TMDB_API_KEY},
                        timeout=10,
                    )
                    if r.status_code == 200:
                        for g in r.json().get("genres", []):
                            genre_counter[g["id"]] += 1
                except Exception:
                    pass

    top_genres = [gid for gid, _ in genre_counter.most_common(3)]

    if not top_genres:
        endpoint = "/trending/movie/week" if media_type == "movie" else "/trending/tv/week"
        data = await tmdb_get(endpoint)
        return [_normalize(m, media_type) for m in data.get("results", [])[:20]]

    discover = "/discover/movie" if media_type == "movie" else "/discover/tv"
    candidate_map: dict = {}
    async with httpx.AsyncClient() as client:
        for genre_id in top_genres:
            for page in range(1, 4):  # fetch 3 pages per genre for a bigger pool
                r = await client.get(
                    f"{TMDB_BASE}{discover}",
                    params={
                        "api_key": TMDB_API_KEY,
                        "with_genres": genre_id,
                        "sort_by": "popularity.desc",
                        "vote_count.gte": 50,
                        "page": page,
                    },
                    timeout=10,
                )
                r.raise_for_status()
                for item in r.json().get("results", []):
                    if item["id"] not in fav_ids:
                        candidate_map[item["id"]] = item

    # Score: genre match is the primary signal, popularity/rating as tiebreaker
    scored = []
    for item in candidate_map.values():
        item_genres = set(item.get("genre_ids", []))
        genre_matches = sum(1 for gid in top_genres if gid in item_genres)
        # Normalize vote_average to 0-1 range so genre match dominates
        rating_bonus = item.get("vote_average", 0) / 10.0
        score = genre_matches * 2 + rating_bonus
        scored.append({**_normalize(item, media_type), "recommendation_score": round(score, 2)})

    scored.sort(key=lambda m: m["recommendation_score"], reverse=True)
    return scored[:20]


@app.get("/health")
async def health():
    return {"status": "ok", "service": "recommendation-service"}


@app.get("/recommendations/health")
async def recommendations_health():
    return {"status": "ok", "service": "recommendation-service"}


@app.get("/recommendations/trending")
async def trending(media_type: str = "movie"):
    endpoint = "/trending/tv/week" if media_type == "tv" else "/trending/movie/week"
    data = await tmdb_get(endpoint)
    return [_normalize(m, media_type) for m in data.get("results", [])]


@app.get("/recommendations")
async def recommendations(user_id: int = Query(...), media_type: str = "movie"):
    return await _build_recommendations(user_id, media_type)
