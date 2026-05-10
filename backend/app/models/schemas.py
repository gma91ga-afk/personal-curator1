from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# --- Onboarding ---

class OnboardingProfile(BaseModel):
    device_id: str
    topics: list[str] = Field(default_factory=list)
    personality: dict = Field(default_factory=dict)
    content_preferences: dict = Field(default_factory=dict)
    notification_times: list[str] = Field(default_factory=list, max_length=3)


class OnboardingQuestions(BaseModel):
    categories: list["QuestionCategory"] = Field(default_factory=list)


class QuestionCategory(BaseModel):
    id: str
    title: str
    questions: list["Question"]


class Question(BaseModel):
    id: str
    text: str
    type: str = "multiple_choice"  # multiple_choice, multi_select, scale, text
    options: list[str] = Field(default_factory=list)


# --- Digest ---

class DigestRequest(BaseModel):
    device_id: str
    force_refresh: bool = False


class DigestItem(BaseModel):
    id: int
    title: str
    summary: str
    source: str
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    relevance_score: float
    bookmarked: bool = False
    read: bool = False


class DigestResponse(BaseModel):
    items: list[DigestItem]
    generated_at: str


# --- Articles ---

class ArticleAction(BaseModel):
    user_id: int
    article_id: int


class ArticleRead(BaseModel):
    id: int
    title: str
    content: str
    summary: str
    source: str
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    external_url: Optional[str] = None
