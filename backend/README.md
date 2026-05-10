# Personal Curator Backend

A FastAPI backend for personalized content curation powered by DeepSeek AI.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DeepSeek API key
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `POST /api/onboarding/profile` — Save user profile after onboarding
- `GET /api/onboarding/questions` — Get onboarding questions
- `POST /api/users/me` — Get/save user profile
- `GET /api/digest` — Fetch personalized digest
- `POST /api/digest/generate` — Generate a new digest
- `POST /api/articles/{id}/bookmark` — Bookmark an article
- `POST /api/articles/{id}/read` — Mark article as read

## Architecture

- `/app/api/` — Route handlers
- `/app/models/` — SQLAlchemy models
- `/app/services/` — Business logic (DeepSeek, ranking)
- `/app/content/` — Content source fetchers (RSS, HN, Reddit)
- `/app/core/` — Config, database, auth
