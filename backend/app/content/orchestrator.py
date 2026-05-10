"""Content orchestrator - fetches from all sources and merges results."""
import asyncio
import logging
from app.content import hackernews, reddit, rss, twitter
from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def fetch_all_content(user_profile: dict) -> list[dict]:
    """Fetch content from all enabled sources based on user preferences."""
    settings = get_settings()
    prefs = user_profile.get("content_preferences", {})
    topics = user_profile.get("topics", [])

    # Determine which sources to use
    enabled_sources = prefs.get("sources", ["hn", "reddit", "rss"])
    raw_volume = prefs.get("content_volume", 10)

    # Convert string volume names to int
    volume_map = {"light": 5, "moderate": 8, "generous": 12, "deep": 18}
    if isinstance(raw_volume, str):
        volume = volume_map.get(raw_volume.lower(), 10)
    else:
        volume = int(raw_volume)

    tasks = []

    if "hn" in enabled_sources or "hackernews" in enabled_sources:
        tasks.append(hackernews.fetch_top_stories(limit=max(10, volume)))

    if "reddit" in enabled_sources:
        tasks.append(reddit.fetch_reddit_posts(topics=topics, limit=max(10, volume)))

    if "rss" in enabled_sources:
        tasks.append(rss.fetch_rss_feeds())

    if "twitter" in enabled_sources or "twitter/x" in enabled_sources:
        tasks.append(twitter.fetch_tweets(limit=15))

    if not tasks:
        # Default: fetch from all sources
        tasks = [
            hackernews.fetch_top_stories(limit=15),
            reddit.fetch_reddit_posts(topics=topics, limit=15),
            rss.fetch_rss_feeds(),
            twitter.fetch_tweets(limit=10),
        ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_articles = []
    for r in results:
        if isinstance(r, list):
            all_articles.extend(r)
        elif isinstance(r, Exception):
            logger.warning(f"Content fetcher failed: {r}")

    # Deduplicate by title similarity
    seen_titles = set()
    unique_articles = []
    for article in all_articles:
        title_key = article.get("title", "").lower().strip()[:100]
        if title_key and title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_articles.append(article)

    logger.info(f"Fetched {len(unique_articles)} unique articles from all sources")
    return unique_articles


def get_article_content(article: dict) -> str:
    """Get the full text content of an article for in-app reading."""
    return article.get("content", article.get("title", "No content available"))
