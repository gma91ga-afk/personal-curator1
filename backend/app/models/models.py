from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Float, func
from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    onboarded = Column(Boolean, default=False)

    # Interests & preferences (JSON blobs for flexibility)
    topics = Column(JSON, default=list)           # ["AI", "startups", "science", ...]
    personality = Column(JSON, default=dict)       # {"tone": "analytical", "depth": "deep", ...}
    content_preferences = Column(JSON, default=dict)  # {"sources": ["hn", "reddit", "rss"], "tone": "casual", ...}
    notification_times = Column(JSON, default=list)   # ["08:00", "18:00", "22:00"]

    # Re-engagement
    digest_count = Column(Integer, default=0)
    last_digest_at = Column(DateTime, nullable=True)


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, index=True)            # "hn", "reddit", "rss", "scrape"
    source_id = Column(String, nullable=True)       # Original ID from source
    external_url = Column(String, nullable=True)    # Original article URL

    title = Column(String, nullable=False)
    content = Column(Text, default="")              # Extracted full text
    summary = Column(Text, default="")              # DeepSeek-generated summary
    author = Column(String, nullable=True)
    published_at = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, server_default=func.now())

    # Scoring & ranking
    relevance_score = Column(Float, default=0.0)
    source_score = Column(Float, default=0.5)       # Quality of source
    engagement_score = Column(Float, default=0.5)    # Social signals (upvotes, etc.)


class ArticleInteraction(Base):
    __tablename__ = "article_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    article_id = Column(Integer, index=True)
    read = Column(Boolean, default=False)
    bookmarked = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    bookmark_at = Column(DateTime, nullable=True)
    interaction_score = Column(Float, default=0.0)   # Implicit feedback signal
