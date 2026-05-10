import json
import logging
from openai import OpenAI
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_client = None


def get_deepseek_client() -> OpenAI:
    global _client
    settings = get_settings()
    if _client is None:
        _client = OpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
    return _client


def summarize_article(title: str, content: str, max_tokens: int = 300) -> str:
    """Generate a concise summary of an article using DeepSeek."""
    client = get_deepseek_client()
    try:
        resp = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a reading assistant. Summarize the following article "
                        "in 2-3 concise sentences. Focus on the key insight or finding. "
                        "Be neutral and factual."
                    ),
                },
                {
                    "role": "user",
                    "content": f"TITLE: {title}\n\nCONTENT:\n{content[:4000]}",
                },
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"DeepSeek summarization failed: {e}")
        # Fallback: return first 200 chars as rough summary
        return content[:200] + "..."


def rank_articles(articles: list[dict], user_profile: dict) -> list[dict]:
    """
    Rank articles by relevance to user's profile using DeepSeek.
    Returns articles sorted by relevance (highest first) with scores.
    """
    if not articles or not user_profile:
        return articles

    client = get_deepseek_client()
    topics = user_profile.get("topics", [])
    personality = user_profile.get("personality", {})
    prefs = user_profile.get("content_preferences", {})

    articles_for_prompt = []
    for i, a in enumerate(articles):
        articles_for_prompt.append({
            "idx": i,
            "title": a.get("title", "")[:150],
            "source": a.get("source", ""),
            "summary_snippet": a.get("summary", "")[:300],
        })

    try:
        resp = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a content ranking AI. Given a user's profile and a list of articles, "
                        "rank each article on a scale of 0.0 to 1.0 for relevance to the user. "
                        "Consider: topic match, depth preference, tone, and source quality. "
                        "Return ONLY a JSON array of objects with 'idx' and 'score', sorted by score descending. "
                        "Example: [{\"idx\": 3, \"score\": 0.95}, {\"idx\": 0, \"score\": 0.82}]"
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"USER PROFILE:\n"
                        f"- Topics interested in: {', '.join(topics)}\n"
                        f"- Preferred depth: {personality.get('depth', 'balanced')}\n"
                        f"- Preferred tone: {personality.get('tone', 'neutral')}\n"
                        f"- Content preferences: {json.dumps(prefs)}\n\n"
                        f"ARTICLES TO RANK:\n{json.dumps(articles_for_prompt, indent=2)}"
                    ),
                },
            ],
            max_tokens=2000,
            temperature=0.2,
        )
        raw = resp.choices[0].message.content.strip()
        # Clean markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("\n", 1)[0]
            if raw.endswith("```"):
                raw = raw[:-3]
        rankings = json.loads(raw)

        # Sort articles by score
        score_map = {r["idx"]: r["score"] for r in rankings}
        for a in articles:
            idx = articles.index(a)
            a["relevance_score"] = score_map.get(idx, 0.5)

        articles.sort(key=lambda a: a.get("relevance_score", 0), reverse=True)
        return articles
    except Exception as e:
        logger.error(f"DeepSeek ranking failed: {e}")
        # Fallback: return as-is with default scores
        for a in articles:
            a["relevance_score"] = a.get("relevance_score", 0.5)
        return articles


def generate_persona_questions() -> list[dict]:
    """Use DeepSeek to dynamically generate onboarding questions."""
    client = get_deepseek_client()
    try:
        resp = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generate onboarding questions for a personalized content curation app. "
                        "Return ONLY a JSON array of question categories. "
                        "Each category has: id, title, and questions (array of objects with: id, text, "
                        "type [one of: multiple_choice, multi_select, scale, text], options). "
                        "Cover: topics of interest, reading depth preference, content tone, "
                        "favorite content types, preferred sources."
                    ),
                },
                {
                    "role": "user",
                    "content": "Generate questions for a new user onboarding flow.",
                },
            ],
            max_tokens=2000,
            temperature=0.7,
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("\n", 1)[0]
            if raw.endswith("```"):
                raw = raw[:-3]
        return json.loads(raw)
    except Exception as e:
        logger.error(f"DeepSeek question generation failed: {e}")
        # Fallback questions if API is down
        return get_default_questions()


def get_default_questions() -> list[dict]:
    """Fallback onboarding questions when DeepSeek is unavailable."""
    return [
        {
            "id": "topics",
            "title": "Your Interests",
            "questions": [
                {
                    "id": "topics_interested",
                    "text": "Which topics excite you most? (Pick 3-5)",
                    "type": "multi_select",
                    "options": [
                        "Artificial Intelligence & ML",
                        "Startups & Business",
                        "Science & Technology",
                        "Design & UX",
                        "Programming & DevTools",
                        "Philosophy & Psychology",
                        "Health & Biohacking",
                        "Finance & Investing",
                        "Climate & Energy",
                        "Culture & Society",
                        "Gaming & Entertainment",
                        "Politics & Policy",
                    ],
                },
                {
                    "id": "content_tone",
                    "text": "What tone do you prefer in your reading?",
                    "type": "multiple_choice",
                    "options": [
                        "Analytical & Deep",
                        "Casual & Conversational",
                        "Concise & Practical",
                        "Storytelling & Narrative",
                    ],
                },
            ],
        },
        {
            "id": "depth",
            "title": "Reading Depth",
            "questions": [
                {
                    "id": "reading_depth",
                    "text": "How deep should your daily reads go?",
                    "type": "multiple_choice",
                    "options": [
                        "Quick summaries (2-3 min reads)",
                        "Balanced (5-10 min reads)",
                        "Deep dives (15-30 min essays)",
                        "Mixed — I like variety",
                    ],
                },
                {
                    "id": "content_types",
                    "text": "What types of content do you enjoy most?",
                    "type": "multi_select",
                    "options": [
                        "News & Current Events",
                        "Long-form Essays",
                        "Tutorials & How-tos",
                        "Opinion & Analysis",
                        "Research Papers",
                        "Industry Newsletters",
                        "Tech Release Notes",
                    ],
                },
            ],
        },
        {
            "id": "sources",
            "title": "Content Sources",
            "questions": [
                {
                    "id": "source_preference",
                    "text": "Where would you like us to find content?",
                    "type": "multi_select",
                    "options": [
                        "HackerNews — Tech community discussions",
                        "Reddit — Niche communities & threads",
                        "RSS Feeds — Major publications",
                        "Twitter/X — Thought leaders & hot takes",
                    ],
                },
                {
                    "id": "content_volume",
                    "text": "How much content per digest?",
                    "type": "multiple_choice",
                    "options": [
                        "Light (3-5 articles)",
                        "Moderate (6-10 articles)",
                        "Generous (11-15 articles)",
                        "Deep (16-20 articles)",
                    ],
                },
            ],
        },
    ]
