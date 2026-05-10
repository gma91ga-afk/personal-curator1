"""Reddit content fetcher using the free JSON API."""
import httpx
import asyncio
import logging
from datetime import datetime
from app.core.config import get_settings

logger = logging.getLogger(__name__)
REDDIT_BASE = "https://www.reddit.com"

# Default subreddits based on common interest categories
DEFAULT_SUBREDDITS = {
    "Artificial Intelligence & ML": ["artificial", "MachineLearning", "singularity"],
    "Startups & Business": ["startups", "Entrepreneur", "business"],
    "Science & Technology": ["science", "technology", "Futurology"],
    "Design & UX": ["Design", "UXDesign", "web_design"],
    "Programming & DevTools": ["programming", "webdev", "reactjs", "python"],
    "Philosophy & Psychology": ["philosophy", "psychology"],
    "Health & Biohacking": ["biohackers", "longevity", "Nootropics"],
    "Finance & Investing": ["investing", "finance", "wallstreetbets"],
    "Climate & Energy": ["climatechange", "energy", "RenewableEnergy"],
    "Gaming & Entertainment": ["gaming", "technology", "pcgaming"],
    "Politics & Policy": ["politics", "worldnews", "geopolitics"],
}


async def fetch_reddit_posts(topics: list[str] = None, limit: int = None) -> list[dict]:
    """Fetch top posts from relevant subreddits based on user topics."""
    settings = get_settings()
    if limit is None:
        limit = settings.reddit_max_posts

    if topics:
        subreddits = set()
        for topic in topics:
            subs = DEFAULT_SUBREDDITS.get(topic, [])
            subreddits.update(subs)
        # Fallback to default subreddits if no match
        if not subreddits:
            subreddits = {"programming", "technology", "artificial"}
    else:
        subreddits = {"technology", "programming", "science", "startups"}

    async with httpx.AsyncClient(
        timeout=15.0,
        headers={"User-Agent": "PersonalCurator/1.0"},
    ) as client:
        tasks = [fetch_subreddit_top(client, sub, limit // len(subreddits) + 1)
                 for sub in subreddits]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    posts = []
    for r in results:
        if isinstance(r, list):
            posts.extend(r)

    # Sort by engagement and limit
    posts.sort(key=lambda p: p.get("engagement_score", 0), reverse=True)
    return posts[:limit]


async def fetch_subreddit_top(client: httpx.AsyncClient, subreddit: str, limit: int) -> list[dict]:
    """Fetch top posts from a subreddit."""
    try:
        url = f"{REDDIT_BASE}/r/{subreddit}/hot.json?limit={limit}&raw_json=1"
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

        posts = []
        for child in data.get("data", {}).get("children", []):
            post = child.get("data", {})
            if post.get("stickied"):
                continue

            published = None
            if post.get("created_utc"):
                published = datetime.fromtimestamp(post["created_utc"])

            score = post.get("score", 0)
            upvote_ratio = post.get("upvote_ratio", 0.5)
            comments = post.get("num_comments", 0)
            engagement = min((score * upvote_ratio + comments * 2) / 500, 1.0)

            posts.append({
                "title": post.get("title", ""),
                "external_url": f"https://reddit.com{post.get('permalink', '')}",
                "source": "reddit",
                "source_id": f"t3_{post.get('id', '')}",
                "content": post.get("selftext", post.get("title", "")),
                "author": post.get("author", ""),
                "published_at": published.isoformat() if published else None,
                "engagement_score": engagement,
            })

        return posts
    except Exception as e:
        logger.warning(f"Failed to fetch r/{subreddit}: {e}")
        return []
