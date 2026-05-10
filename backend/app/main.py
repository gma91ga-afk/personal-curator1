"""Personal Curator - FastAPI Backend Application."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.api.onboarding import router as onboarding_router
from app.api.digest import router as digest_router
from app.services.scheduler_service import start_scheduler, shutdown_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - init DB and scheduler on startup."""
    logger.info("Starting Personal Curator backend...")
    init_db()
    start_scheduler()
    yield
    shutdown_scheduler()
    logger.info("Shutdown complete.")


settings = get_settings()
app = FastAPI(
    title="Personal Curator API",
    description="AI-powered personalized content curation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for React Native dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(onboarding_router)
app.include_router(digest_router)


@app.get("/")
async def root():
    return {
        "app": "Personal Curator",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
