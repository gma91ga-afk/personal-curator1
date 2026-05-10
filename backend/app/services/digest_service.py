"""Digest generation service.

Strategy:
1. If articles already exist in the DB → return them immediately (fast path, <1s)
2. In the background, fetch + summarize + rank new articles for next time
3. Only do the full 3-4 minute generation if there are ZERO articles (first-ever load)
"""
import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.models import UserProfile, Article, ArticleInteraction
from app.content.orchestrator import fetch_all_content
from app.services.deepseek_service import summarize_article, rank_articles

logger = logging.getLogger(__name__)

REFRESH_LOCK: set[int] = set()  # user IDs currently being refreshed


async def generate_digest(user: UserProfile, db: Session, force_refresh: bool = False) -> list[dict]:
    """Return existing articles fast. Refresh in background for next time."""
    profile = {
        "topics": user.topics or [],
        "personality": user.personality or {},
        "content_preferences": user.content_preferences or {},
    }

    volume_map = {"light": 5, "moderate": 8, "generous": 12, "deep": 18}
    volume = profile.get("content_preferences", {}).get("content_volume", "moderate")
    count = volume_map.get(volume, 8)

    # Check if we have existing articles
    existing = db.query(Article).order_by(Article.fetched_at.desc()).limit(count).all()

    if existing and not force_refresh:
        logger.info(f"Returning {len(existing)} cached articles for user {user.id}")

        # Kick off background refresh (non-blocking)
        if user.id not in REFRESH_LOCK:
            REFRESH_LOCK.add(user.id)
            asyncio.create_task(_refresh_in_background(user.id, profile, count))
        else:
            logger.info(f"Background refresh already in progress for user {user.id}")

        # Return existing articles immediately
        return _articles_to_response(existing)

    if existing and force_refresh:
        logger.info(f"Force refresh requested for user {user.id}")
        # Return existing articles immediately, refresh in background
        if user.id not in REFRESH_LOCK:
            REFRESH_LOCK.add(user.id)
            asyncio.create_task(_refresh_in_background(user.id, profile, count))
        return _articles_to_response(existing)

    # First-ever load — no articles at all. Do the full generation synchronously.
    logger.info(f"First-ever generation for user {user.id} — this will take 3-4 minutes")
    return await _full_generation(user, db, profile, count)


async def _refresh_in_background(user_id: int, profile: dict, count: int):
    """Fetch, summarize, rank, and store new articles. Runs in background."""
    try:
        logger.info(f"Background refresh starting for user {user_id}")

        raw_articles = await fetch_all_content(profile)
        if not raw_articles:
            logger.warning(f"Background refresh found no articles for user {user_id}")
            return

        # Summarize
        for article in raw_articles:
            if not article.get("summary"):
                try:
                    article["summary"] = summarize_article(
                        article.get("title", ""),
                        article.get("content", ""),
                    )
                except Exception as e:
                    logger.warning(f"Summarization failed: {e}")
                    article["summary"] = article.get("content", "")[:200] + "..."

        # Rank
        ranked = rank_articles(raw_articles, profile)

        # Save to DB
        from app.core.database import SessionLocal
        db: Session = SessionLocal()
        try:
            for item in ranked[:count]:
                existing = db.query(Article).filter(
                    Article.source_id == item.get("source_id", ""),
                    Article.source == item.get("source", ""),
                ).first()
                if existing:
                    existing.relevance_score = item.get("relevance_score", 0.5)
                    existing.engagement_score = item.get("engagement_score", 0.5)
                    existing.summary = item.get("summary", existing.summary)
                else:
                    db.add(Article(
                        title=item.get("title", "Untitled"),
                        source=item.get("source", "unknown"),
                        source_id=item.get("source_id", ""),
                        external_url=item.get("external_url", ""),
                        content=item.get("content", ""),
                        summary=item.get("summary", ""),
                        author=item.get("author"),
                        relevance_score=item.get("relevance_score", 0.5),
                        source_score=item.get("source_score", 0.5),
                        engagement_score=item.get("engagement_score", 0.5),
                    ))
            db.commit()
            logger.info(f"Background refresh complete for user {user_id}: {len(ranked[:count])} articles stored")
        finally:
            db.close()
    except Exception as e:
        logger.exception(f"Background refresh failed for user {user_id}: {e}")
    finally:
        REFRESH_LOCK.discard(user_id)


async def _full_generation(user: UserProfile, db: Session, profile: dict, count: int) -> list[dict]:
    """Full generation for first-ever load (this is the slow 3-4 minute path)."""
    raw_articles = await fetch_all_content(profile)

    if not raw_articles:
        logger.warning(f"No articles found for user {user.id}")
        return []

    for article in raw_articles:
        if not article.get("summary"):
            try:
                article["summary"] = summarize_article(
                    article.get("title", ""),
                    article.get("content", ""),
                )
            except Exception as e:
                logger.warning(f"Summarization failed: {e}")
                article["summary"] = article.get("content", "")[:200] + "..."

    ranked = rank_articles(raw_articles, profile)

    user.digest_count += 1
    user.last_digest_at = datetime.utcnow()

    saved_articles = []
    for item in ranked[:count]:
        db_article = Article(
            title=item.get("title", "Untitled"),
            source=item.get("source", "unknown"),
            source_id=item.get("source_id", ""),
            external_url=item.get("external_url", ""),
            content=item.get("content", ""),
            summary=item.get("summary", ""),
            author=item.get("author"),
            relevance_score=item.get("relevance_score", 0.5),
            source_score=item.get("source_score", 0.5),
            engagement_score=item.get("engagement_score", 0.5),
        )
        db.add(db_article)
        db.flush()
        saved_articles.append({
            "id": db_article.id,
            "title": db_article.title,
            "summary": db_article.summary,
            "source": db_article.source,
            "author": db_article.author,
            "external_url": db_article.external_url,
            "relevance_score": db_article.relevance_score,
            "read": False,
            "bookmarked": False,
        })

    db.commit()
    return saved_articles


def _articles_to_response(articles: list[Article]) -> list[dict]:
    """Convert Article ORM objects to digest response dicts."""
    result = []
    for a in articles:
        result.append({
            "id": a.id,
            "title": a.title,
            "summary": a.summary or a.content[:200] + "...",
            "source": a.source,
            "author": a.author,
            "external_url": a.external_url,
            "relevance_score": a.relevance_score,
            "read": False,
            "bookmarked": False,
        })
    return result
