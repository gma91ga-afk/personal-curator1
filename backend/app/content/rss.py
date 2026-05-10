"""RSS feed content fetcher."""
import feedparser
import httpx
import logging
from datetime import datetime
from bs4 import BeautifulSoup
from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def fetch_rss_feeds(feed_urls: list[str] = None) -> list[dict]:
    """Fetch articles from configured RSS feeds."""
    settings = get_settings()
    if feed_urls is None:
        feed_urls = settings.rss_feeds

    articles = []
    for url in feed_urls:
        try:
            articles.extend(await _parse_feed(url))
        except Exception as e:
            logger.warning(f"Failed to parse RSS feed {url}: {e}")

    return articles


async def _parse_feed(feed_url: str) -> list[dict]:
    """Parse a single RSS feed."""
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.get(feed_url)
        resp.raise_for_status()
        feed = feedparser.parse(resp.text)

    articles = []
    for entry in feed.entries[:15]:  # Max 15 per feed
        try:
            title = entry.get("title", "")
            link = entry.get("link", "")

            # Extract content
            content_html = ""
            if hasattr(entry, "content") and entry.content:
                content_html = entry.content[0].get("value", "")
            elif hasattr(entry, "summary"):
                content_html = entry.summary

            # Strip HTML
            soup = BeautifulSoup(content_html, "lxml")
            content_text = soup.get_text(separator=" ", strip=True)
            if not content_text:
                content_text = title

            # Published date
            published = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                published = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                published = datetime(*entry.updated_parsed[:6])

            author = ""
            if hasattr(entry, "author"):
                author = entry.author

            articles.append({
                "title": title,
                "external_url": link,
                "source": "rss",
                "source_id": entry.get("id", link),
                "content": content_text[:5000],
                "author": author,
                "published_at": published.isoformat() if published else None,
                "engagement_score": 0.5,  # Neutral default for RSS
            })
        except Exception as e:
            logger.warning(f"Failed to parse entry from {feed_url}: {e}")

    return articles
