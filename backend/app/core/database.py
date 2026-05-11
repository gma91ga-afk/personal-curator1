import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

# Use DATABASE_URL from environment if set (Render/PostgreSQL), otherwise SQLite for local dev
database_url = os.environ.get("DATABASE_URL") or settings.database_url

# Render sometimes uses "postgres://" but SQLAlchemy needs "postgresql://"
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

is_sqlite = "sqlite" in database_url

engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
