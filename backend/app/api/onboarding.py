"""Onboarding API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import UserProfile
from app.models.schemas import OnboardingProfile, OnboardingQuestions
from app.services.deepseek_service import generate_persona_questions, get_default_questions

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.get("/questions", response_model=dict)
async def get_onboarding_questions():
    """Get onboarding questions for the user."""
    try:
        questions = await generate_persona_questions()
        return {"categories": questions}
    except Exception:
        return {"categories": get_default_questions()}


@router.post("/profile")
async def save_onboarding_profile(profile: OnboardingProfile, db: Session = Depends(get_db)):
    """Save the user's onboarding profile."""
    existing = db.query(UserProfile).filter(
        UserProfile.device_id == profile.device_id
    ).first()

    if existing:
        existing.topics = profile.topics
        existing.personality = profile.personality
        existing.content_preferences = profile.content_preferences
        existing.notification_times = profile.notification_times
        existing.onboarded = True
        db.commit()
        return {"status": "updated", "user_id": existing.id}

    user = UserProfile(
        device_id=profile.device_id,
        topics=profile.topics,
        personality=profile.personality,
        content_preferences=profile.content_preferences,
        notification_times=profile.notification_times,
        onboarded=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"status": "created", "user_id": user.id}


@router.get("/status/{device_id}")
async def get_onboarding_status(device_id: str, db: Session = Depends(get_db)):
    """Check if a user has completed onboarding."""
    user = db.query(UserProfile).filter(
        UserProfile.device_id == device_id
    ).first()
    return {"onboarded": user is not None and user.onboarded}
