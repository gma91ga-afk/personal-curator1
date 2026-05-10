"""Digest and article API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.models import UserProfile, Article, ArticleInteraction
from app.models.schemas import DigestRequest, DigestResponse, DigestItem, ArticleRead
from app.services.digest_service import generate_digest

router = APIRouter(prefix="/api", tags=["digest"])


@router.post("/digest/generate", response_model=DigestResponse)
async def create_digest(req: DigestRequest, db: Session = Depends(get_db)):
    """Generate a fresh personalized digest."""
    user = db.query(UserProfile).filter(
        UserProfile.device_id == req.device_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Complete onboarding first.")

    items = await generate_digest(user, db, force_refresh=req.force_refresh)

    return DigestResponse(
        items=[DigestItem(**item) for item in items],
        generated_at=datetime.utcnow().isoformat(),
    )


@router.get("/digest/{device_id}", response_model=DigestResponse)
async def get_latest_digest(device_id: str, db: Session = Depends(get_db)):
    """Get the latest digest from the database."""
    user = db.query(UserProfile).filter(
        UserProfile.device_id == device_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    recent_articles = db.query(Article).order_by(Article.fetched_at.desc()).limit(10).all()

    if not recent_articles:
        return DigestResponse(items=[], generated_at=datetime.utcnow().isoformat())

    items = []
    for a in recent_articles:
        interaction = db.query(ArticleInteraction).filter(
            ArticleInteraction.user_id == user.id,
            ArticleInteraction.article_id == a.id,
        ).first()
        items.append(DigestItem(
            id=a.id,
            title=a.title,
            summary=a.summary or a.content[:200] + "...",
            source=a.source,
            author=a.author,
            published_at=a.published_at,
            relevance_score=a.relevance_score,
            bookmarked=interaction.bookmarked if interaction else False,
            read=interaction.read if interaction else False,
        ))

    return DigestResponse(items=items, generated_at=datetime.utcnow().isoformat())


@router.get("/articles/{article_id}", response_model=ArticleRead)
async def get_article(article_id: int, db: Session = Depends(get_db)):
    """Get full article content for in-app reading."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleRead(
        id=article.id,
        title=article.title,
        content=article.content or article.summary,
        summary=article.summary or "",
        source=article.source,
        author=article.author,
        published_at=article.published_at,
        external_url=article.external_url,
    )


@router.post("/articles/{article_id}/bookmark")
async def bookmark_article(article_id: int, user_id: int, db: Session = Depends(get_db)):
    """Toggle bookmark on an article."""
    interaction = db.query(ArticleInteraction).filter(
        ArticleInteraction.user_id == user_id,
        ArticleInteraction.article_id == article_id,
    ).first()

    if interaction:
        interaction.bookmarked = not interaction.bookmarked
        interaction.bookmark_at = datetime.utcnow() if interaction.bookmarked else None
    else:
        interaction = ArticleInteraction(
            user_id=user_id,
            article_id=article_id,
            bookmarked=True,
            bookmark_at=datetime.utcnow(),
        )
        db.add(interaction)

    db.commit()
    return {"bookmarked": interaction.bookmarked}


@router.post("/articles/{article_id}/read")
async def mark_read(article_id: int, user_id: int, db: Session = Depends(get_db)):
    """Mark article as read."""
    interaction = db.query(ArticleInteraction).filter(
        ArticleInteraction.user_id == user_id,
        ArticleInteraction.article_id == article_id,
    ).first()

    if interaction:
        interaction.read = True
        interaction.read_at = datetime.utcnow()
    else:
        interaction = ArticleInteraction(
            user_id=user_id,
            article_id=article_id,
            read=True,
            read_at=datetime.utcnow(),
        )
        db.add(interaction)

    db.commit()
    return {"status": "read"}
