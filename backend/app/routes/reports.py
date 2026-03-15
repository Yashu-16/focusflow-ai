from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import FocusSession, Activity, EmailRecord, CommandHistory
from datetime import datetime, timedelta
 
router = APIRouter()
 
 
def get_weekly_stats(db: Session, user_id: str) -> dict:
    week_ago = datetime.now() - timedelta(days=7)
 
    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user_id,
        FocusSession.start_time >= week_ago,
        FocusSession.is_active == False
    ).all()
    focus_seconds = sum(s.duration_seconds or 0 for s in sessions)
    focus_hours = focus_seconds / 3600
 
    activities = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.timestamp >= week_ago
    ).all()
 
    activity_counts = {}
    for a in activities:
        activity_counts[a.activity_type] = activity_counts.get(a.activity_type, 0) + 1
 
    top_activity = max(activity_counts, key=activity_counts.get) if activity_counts else "none"
    routine_hours = len(activities) * 0.05
 
    total_hours = focus_hours + routine_hours
    efficiency = (focus_hours / total_hours * 100) if total_hours > 0 else 0
 
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
 
    email_count = db.query(EmailRecord).filter(
        EmailRecord.user_id == user_id,
        EmailRecord.created_at >= week_ago
    ).count()
 
    ai_handled_items = email_count + len(activities)
    cognitive_minutes_saved = ai_handled_items * 3
    cognitive_hours_saved = round(cognitive_minutes_saved / 60, 1)
 
    longest_session_minutes = 0
    best_focus_day = None
    if sessions:
        longest = max(sessions, key=lambda s: s.duration_seconds or 0)
        longest_session_minutes = round((longest.duration_seconds or 0) / 60)
        if longest.start_time:
            best_focus_day = longest.start_time.strftime("%A")
 
    work_about_work_pct = round((routine_hours / total_hours * 100) if total_hours > 0 else 60, 1)
 
    # Peak focus window: find hour with most focus sessions
    hour_counts = {}
    for s in sessions:
        if s.start_time:
            h = s.start_time.hour
            hour_counts[h] = hour_counts.get(h, 0) + (s.duration_seconds or 0)
    peak_hour = None
    if hour_counts:
        peak_h = max(hour_counts, key=hour_counts.get)
        peak_hour = f"{peak_h}:00-{peak_h+1}:00"
 
    return {
        "focus_hours": round(focus_hours, 2),
        "routine_hours": round(routine_hours, 2),
        "efficiency": round(efficiency, 1),
        "total_sessions": len(sessions),
        "top_activity": top_activity,
        "activity_breakdown": activity_counts,
        "daily_focus": daily_focus,
        "email_count": email_count,
        "cognitive_hours_saved": cognitive_hours_saved,
        "cognitive_minutes_saved": cognitive_minutes_saved,
        "ai_handled_items": ai_handled_items,
        "longest_session_minutes": longest_session_minutes,
        "best_focus_day": best_focus_day,
        "work_about_work_pct": work_about_work_pct,
        "peak_focus_window": peak_hour,
    }
 
 
def get_daily_stats(db: Session, user_id: str) -> dict:
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
 
    # Today's sessions
    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user_id,
        FocusSession.start_time >= today_start,
        FocusSession.is_active == False
    ).all()
 
    focus_seconds = sum(s.duration_seconds or 0 for s in sessions)
 
    # Longest session today
    longest_session_minutes = 0
    if sessions:
        longest = max(sessions, key=lambda s: s.duration_seconds or 0)
        longest_session_minutes = round((longest.duration_seconds or 0) / 60)
 
    # Peak focus window today
    hour_counts = {}
    for s in sessions:
        if s.start_time:
            h = s.start_time.hour
            hour_counts[h] = hour_counts.get(h, 0) + (s.duration_seconds or 0)
    peak_hour = None
    if hour_counts:
        peak_h = max(hour_counts, key=hour_counts.get)
        peak_hour = f"{peak_h}:00–{peak_h+1}:00"
 
    # Context switches today (tab_switch activities)
    activities = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.timestamp >= today_start
    ).all()
 
    context_switches = sum(1 for a in activities if a.activity_type == 'tab_switch')
    total_activities = len(activities)
 
    # Flow rate: focus_seconds / (focus_seconds + context_switches * 180)
    flow_denominator = focus_seconds + context_switches * 180
    flow_rate = round((focus_seconds / flow_denominator * 100) if flow_denominator > 0 else 0, 1)
 
    # AI handled items today
    email_count_today = db.query(EmailRecord).filter(
        EmailRecord.user_id == user_id,
        EmailRecord.created_at >= today_start
    ).count()
    ai_handled_today = email_count_today + total_activities
    ai_minutes_saved_today = ai_handled_today * 3
 
    return {
        "focus_seconds": focus_seconds,
        "focus_hours": round(focus_seconds / 3600, 2),
        "sessions_today": len(sessions),
        "longest_session_minutes": longest_session_minutes,
        "peak_focus_window": peak_hour,
        "context_switches": context_switches,
        "flow_rate": flow_rate,
        "ai_handled_today": ai_handled_today,
        "ai_minutes_saved_today": ai_minutes_saved_today,
        "sessions": [{
            "task_name": s.task_name,
            "duration_seconds": s.duration_seconds,
            "start_time": s.start_time,
            "is_active": s.is_active
        } for s in sessions]
    }
 
 
@router.get("/weekly")
def weekly_report(user_id: str = "default_user", db: Session = Depends(get_db)):
    return get_weekly_stats(db, user_id)
 
 
@router.get("/daily")
def daily_report(user_id: str = "default_user", db: Session = Depends(get_db)):
    return get_daily_stats(db, user_id)
 
 
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
