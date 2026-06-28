# Movie Recommendation App

A microservices-based movie recommendation application powered by TMDB.

## Architecture

| Service | Language | Port | Description |
|---|---|---|---|
| user-service | Node.js + Express | 3001 | Auth, profiles, favorites |
| catalog-service | Python + FastAPI | 3002 | TMDB movie data |
| recommendation-service | Python + FastAPI | 3003 | Personalized recommendations |
| frontend | React | 3000 | Web UI |
| nginx | Nginx | 80 | API Gateway |
| postgres | PostgreSQL | 5432 | Database (user-service only) |

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd movie-recommendation-app
```

### 2. Configure environment variables

```bash
cp .env .env
```

Edit `.env` and fill in your values.

### 3. Get a TMDB API key

1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API → Request an API Key
4. Copy the API key into `.env` as `TMDB_API_KEY`

### 4. Run with Docker Compose

```bash
docker-compose up --build
```

### 5. Access the app

Open [http://localhost](http://localhost) in your browser.

## Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml        # update secrets first!
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/user-service/
kubectl apply -f k8s/catalog-service/
kubectl apply -f k8s/recommendation-service/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress.yaml
```

Add `127.0.0.1 movie-app.local` to `/etc/hosts`, then visit [http://movie-app.local](http://movie-app.local).

## CI/CD

GitHub Actions workflow at `.github/workflows/ci-cd.yaml`:

- **develop branch** — builds all Docker images (no push)
- **main branch** — builds and pushes images to DockerHub with `:latest` and `:<git-sha>` tags

Required GitHub secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
