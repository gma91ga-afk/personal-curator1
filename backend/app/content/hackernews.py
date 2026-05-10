"""HackerNews content fetcher using the free Firebase API."""
import httpx
import asyncio
import logging
from datetime import datetime
from app.core.config import get_settings

logger = logging.getLogger(__name__)
HN_API_BASE = "https://hacker-news.firebaseio.com/v0"


async def fetch_top_stories(limit: int = None) -> list[dict]:
    """Fetch top stories from HackerNews."""
    settings = get_settings()
    if limit is None:
        limit = settings.hn_max_items

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{HN_API_BASE}/topstories.json")
        resp.raise_for_status()
        story_ids = resp.json()[:limit]

        tasks = [fetch_story(client, sid) for sid in story_ids]
        stories = await asyncio.gather(*tasks, return_exceptions=True)

    return [
        s for s in stories
        if isinstance(s, dict) and s.get("title") and not s.get("dead")
    ]


async def fetch_story(client: httpx.AsyncClient, story_id: int) -> dict | None:
    """Fetch a single HN story."""
    try:
        resp = await client.get(f"{HN_API_BASE}/item/{story_id}.json")
        resp.raise_for_status()
        data = resp.json()
        if not data or data.get("type") != "story":
            return None

        published = None
        if data.get("time"):
            published = datetime.fromtimestamp(data["time"])

        return {
            "title": data.get("title", ""),
            "external_url": data.get("url", f"https://news.ycombinator.com/item?id={story_id}"),
            "source": "hackernews",
            "source_id": str(story_id),
            "content": data.get("text", data.get("title", "")),
            "author": data.get("by", ""),
            "published_at": published.isoformat() if published else None,
            "engagement_score": min(data.get("score", 0) / 100, 1.0),
        }
    except Exception as e:
        logger.warning(f"Failed to fetch HN story {story_id}: {e}")
        return None
