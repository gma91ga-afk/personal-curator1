# Curator — Personalized Content Curation App

An Android app that delivers AI-personalized content digests at your preferred schedule. Content is read entirely inside the app — no external browsers needed.

## Architecture

```
personal-curator/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── api/               # Route handlers
│   │   │   ├── onboarding.py  # Onboarding questions + profile
│   │   │   └── digest.py      # Digest generation + articles
│   │   ├── core/              # Config, database, init
│   │   ├── models/            # SQLAlchemy models + Pydantic schemas
│   │   ├── services/          # Business logic
│   │   │   ├── deepseek_service.py  # AI summarization + ranking
│   │   │   ├── digest_service.py    # Digest orchestration
│   │   │   └── scheduler_service.py # Notification scheduling
│   │   └── content/           # Content source fetchers
│   │       ├── hackernews.py  # HackerNews API (free)
│   │       ├── reddit.py      # Reddit API (free tier)
│   │       ├── rss.py         # RSS feed parser
│   │       ├── twitter.py     # Nitter (free Twitter scraping)
│   │       └── orchestrator.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                   # React Native app
    ├── App.tsx                 # Root — onboarding vs feed routing
    └── src/
        ├── screens/
        │   ├── OnboardingFlow.tsx      # Orchestrates all 5 onboarding screens
        │   ├── DigestFeed.tsx           # Main content feed
        │   ├── ArticleReader.tsx        # In-app reading view
        │   └── onboarding/             # Individual onboarding steps
        │       ├── WelcomeScreen.tsx
        │       ├── TopicsScreen.tsx     # Interest topics
        │       ├── ToneDepthScreen.tsx  # Tone + depth preferences
        │       ├── SourcesScreen.tsx    # Content sources
        │       └── NotificationsScreen.tsx
        ├── components/
        │   └── OnboardingComponents.tsx # Reusable UI components
        ├── services/
        │   └── api.ts           # Backend API client
        └── utils/
            ├── theme.ts         # Dark theme constants
            └── storage.ts       # Local storage helpers
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (TypeScript) |
| Backend | Python FastAPI |
| AI | DeepSeek API (summarization + ranking) |
| Database | SQLite (via SQLAlchemy) |
| Content | HackerNews API, Reddit JSON API, RSS feeds, Nitter (Twitter) |
| Scheduler | APScheduler (notification times) |

## Onboarding Flow (5 screens)

1. **Welcome** — App intro with feature highlights
2. **Topics** — Multi-select from 12 interest categories (3-5 required)
3. **Tone & Depth** — Reading style, preferred tone, content types
4. **Sources** — HackerNews, Reddit, RSS, Twitter — daily volume
5. **Notifications** — Set 1-3 daily delivery times

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: add your DEEPSEEK_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npx react-native run-android
```

Edit `src/services/api.ts` to point `DEV_API_URL` to your backend address.
Android emulator: `http://10.0.2.2:8000`
Physical device: your machine's LAN IP.

## Content Sources (all free)

- **HackerNews** — Firebase API, top stories
- **Reddit** — JSON API, top posts from relevant subreddits
- **RSS** — Publications (TechCrunch, The Verge, Wired, Ars Technica, Google AI Blog)
- **Twitter/X** — Nitter instances (no API key needed)

## AI Features (DeepSeek)

- **Article summarization** — 2-3 sentence concise summaries
- **Content ranking** — Personalized relevance scoring based on user profile
- **Dynamic question generation** — Optional: AI-generated onboarding questions

## License

MIT
