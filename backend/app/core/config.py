from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    deepseek_api_key: str = ""
    database_url: str = "sqlite:///./curator.db"
    secret_key: str = "change-this-in-production"
    debug: bool = True

    # Content source config
    hn_max_items: int = 30
    reddit_max_posts: int = 25
    rss_feeds: list[str] = [
        "https://feeds.feedburner.com/TechCrunch",
        "https://hnrss.org/frontpage",
        "https://www.theverge.com/rss/index.xml",
        "https://www.wired.com/feed/rss",
        "https://arstechnica.com/feed/",
        "https://blog.google/technology/ai/rss/",
    ]
    rss_timeout: int = 15

    # DeepSeek config
    deepseek_model: str = "deepseek-chat"
    deepseek_base_url: str = "https://api.deepseek.com"
    max_summary_tokens: int = 500

    # Scheduling
    max_notification_times: int = 3

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
