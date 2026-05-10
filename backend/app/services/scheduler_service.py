"""Notification scheduling service."""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


_trigger_cache: dict[str, list[str]] = {}  # user_id -> job_ids


def parse_time_to_cron(time_str: str) -> str:
    """Convert 'HH:MM' to cron expression."""
    try:
        hour, minute = time_str.strip().split(":")
        return f"{minute} {hour} * * *"
    except (ValueError, AttributeError):
        logger.warning(f"Invalid time format: {time_str}, using 08:00")
        return "0 8 * * *"


def schedule_user_digest(
    user_id: int,
    device_id: str,
    notification_times: list[str],
    digest_callback,
):
    """Schedule digest generation at user-preferred times."""
    # Remove existing schedules for this user
    unschedule_user(user_id)

    if user_id not in _trigger_cache:
        _trigger_cache[user_id] = []

    for time_str in notification_times:
        cron_expr = parse_time_to_cron(time_str)
        job_id = f"digest_{user_id}_{time_str.replace(':', '_')}"

        scheduler.add_job(
            digest_callback,
            CronTrigger.from_crontab(cron_expr),
            args=[device_id],
            id=job_id,
            replace_existing=True,
            misfire_grace_time=300,
        )
        _trigger_cache[user_id].append(job_id)
        logger.info(f"Scheduled digest for user {user_id} at {time_str} ({cron_expr})")


def unschedule_user(user_id: int):
    """Remove all scheduled digests for a user."""
    existing = _trigger_cache.pop(user_id, [])
    for job_id in existing:
        try:
            scheduler.remove_job(job_id)
        except Exception:
            pass


def start_scheduler():
    """Start the APScheduler."""
    if not scheduler.running:
        scheduler.start()
        logger.info("Digest scheduler started")


def shutdown_scheduler():
    """Shutdown the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
