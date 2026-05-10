"""Twitter/X content scraper using nitter.net (free, no API key)."""
import httpx
import re
import logging
from bs4 import BeautifulSoup
from datetime import datetime

logger = logging.getLogger(__name__)

# Nitter instances for fetching tweets without API
NITTER_INSTANCES = [
    "https://nitter.net",
    "https://nitter.lqdev.org",
    "https://nitter.1d4.us",
]

# Default accounts to follow based on interest topics
DEFAULT_ACCOUNTS = {
    "Artificial Intelligence & ML": [
        "karpathy", "ylecun", "AndrewYNg", "DrJimFan", "sama",
    ],
    "Startups & Business": [
        "paulg", "samaltman", "naval",
    ],
    "Science & Technology": [
        "elonmusk", "verge", "wired",
    ],
    "Programming & DevTools": [
        "github", "python_tip", "reactjs",
    ],
}


async def fetch_tweets(topic_accounts: list[str] = None, limit: int = 15) -> list[dict]:
    """Fetch recent tweets from relevant accounts via Nitter."""
    accounts = topic_accounts or []
    if not accounts:
        accounts = DEFAULT_ACCOUNTS.get("Artificial Intelligence & ML", [])[:3]

    tweets = []
    instance = await _find_working_instance()
    if not instance:
        logger.warning("No working Nitter instance found")
        return tweets

    async with httpx.AsyncClient(
        timeout=15.0,
        headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
        follow_redirects=True,
    ) as client:
        for account in accounts[:5]:
            try:
                url = f"{instance}/{account}/tweets"
                resp = await client.get(url)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, "lxml")
                tweet_divs = soup.select("div.tweet-content")[:limit // len(accounts[:5]) + 1]

                for div in tweet_divs:
                    text = div.get_text(strip=True)
                    if text and len(text) > 20:
                        tweets.append({
                            "title": text[:100] + ("..." if len(text) > 100 else ""),
                            "external_url": "",  # Nitter URL would go here
                            "source": "twitter",
                            "source_id": "",
                            "content": text,
                            "author": account,
                            "published_at": None,
                            "engagement_score": 0.5,
                        })
            except Exception as e:
                logger.warning(f"Failed to fetch tweets for @{account}: {e}")

    return tweets[:limit]


async def _find_working_instance() -> str | None:
    """Find first working Nitter instance."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        for instance in NITTER_INSTANCES:
            try:
                resp = await client.get(instance)
                if resp.status_code == 200:
                    return instance
            except Exception:
                continue
    return None
