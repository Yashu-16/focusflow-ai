from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import FocusSession, Activity, EmailRecord, CommandHistory
from datetime import datetime, timedelta

router = APIRouter()


def get_weekly_stats(db: Session, user_id: str) -> dict:
    week_ago = datetime.now() - timedelta(days=7)

    # Focus time
    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user_id,
        FocusSession.start_time >= week_ago,
        FocusSession.is_active == False
    ).all()
    focus_seconds = sum(s.duration_seconds or 0 for s in sessions)
    focus_hours = focus_seconds / 3600

    # Activity breakdown
    activities = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.timestamp >= week_ago
    ).all()

    activity_counts = {}
    for a in activities:
        activity_counts[a.activity_type] = activity_counts.get(a.activity_type, 0) + 1

    top_activity = max(activity_counts, key=activity_counts.get) if activity_counts else "none"
    routine_hours = len(activities) * 0.05  # estimate

    total_hours = focus_hours + routine_hours
    efficiency = (focus_hours / total_hours * 100) if total_hours > 0 else 0

    # Daily breakdown for chart
    daily_focus = []
    for i in range(7):
        day = datetime.now() - timedelta(days=6 - i)
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        day_sessions = [s for s in sessions if s.start_time and day_start <= s.start_time <= day_end]
        day_hours = sum(s.duration_seconds or 0 for s in day_sessions) / 3600
        daily_focus.append({
            "day": day.strftime("%a"),
            "date": day.strftime("%Y-%m-%d"),
            "focus_hours": round(day_hours, 2)
        })

    return {
        "focus_hours": round(focus_hours, 2),
        "routine_hours": round(routine_hours, 2),
        "efficiency": round(efficiency, 1),
        "total_sessions": len(sessions),
        "top_activity": top_activity,
        "activity_breakdown": activity_counts,
        "daily_focus": daily_focus,
        "email_count": db.query(EmailRecord).filter(
            EmailRecord.user_id == user_id,
            EmailRecord.created_at >= week_ago
        ).count()
    }


@router.get("/weekly")
def weekly_report(user_id: str = "default_user", db: Session = Depends(get_db)):
    stats = get_weekly_stats(db, user_id)
    return stats


@router.get("/daily")
def daily_report(user_id: str = "default_user", db: Session = Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0)

    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user_id,
        FocusSession.start_time >= today
    ).all()

    focus_seconds = sum(s.duration_seconds or 0 for s in sessions)

    activities = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.timestamp >= today
    ).all()

    return {
        "focus_seconds": focus_seconds,
        "focus_hours": round(focus_seconds / 3600, 2),
        "sessions_today": len(sessions),
        "activities_today": len(activities),
        "sessions": [{
            "task_name": s.task_name,
            "duration_seconds": s.duration_seconds,
            "start_time": s.start_time,
            "is_active": s.is_active
        } for s in sessions]
    }


@router.get("/commands/{user_id}")
def get_command_history(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    commands = db.query(CommandHistory).filter(
        CommandHistory.user_id == user_id
    ).order_by(CommandHistory.created_at.desc()).limit(limit).all()

    return [{
        "id": c.id,
        "command": c.command,
        "intent": c.intent,
        "result": c.result[:200] + "..." if len(c.result) > 200 else c.result,
        "created_at": c.created_at
    } for c in commands]
