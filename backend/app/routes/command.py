from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, CommandHistory, EmailRecord, NewsArticle
from app.ai.ai_service import call_ai, classify_intent, summarize_emails, summarize_news, generate_productivity_insights, extract_preference, extract_priority_rule
from datetime import datetime, timedelta
 
router = APIRouter()
 
 
class CommandRequest(BaseModel):
    user_id: str
    command: str
 
 
def get_or_create_user(db: Session, user_id: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
 
 
@router.post("/command")
async def process_command(req: CommandRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, req.user_id)
 
    intent_data = await classify_intent(req.command)
    intent = intent_data.get("intent", "general_question")
 
    result = ""
 
    if intent == "summarize_emails":
        emails = db.query(EmailRecord).filter(
            EmailRecord.user_id == req.user_id
        ).order_by(EmailRecord.created_at.desc()).limit(20).all()
        email_list = [
            {"sender": e.sender, "sender_name": e.sender_name,
             "subject": e.subject, "snippet": e.snippet}
            for e in emails
        ]
        result = await summarize_emails(email_list)
 
    elif intent == "daily_news":
        articles = db.query(NewsArticle).order_by(
            NewsArticle.timestamp.desc()
        ).limit(20).all()
        article_list = [
            {"headline": a.headline, "summary": a.summary, "source": a.source}
            for a in articles
        ]
        result = await summarize_news(article_list)
 
    elif intent == "start_focus":
        from app.models.models import FocusSession
        task = intent_data.get("parameters", {}).get("task") or "Focus Session"
        active = db.query(FocusSession).filter(
            FocusSession.user_id == req.user_id,
            FocusSession.is_active == True
        ).first()
        if active:
            result = f"⚠️ Already have active session: **{active.task_name}**. Say 'stop focus' first."
        else:
            session = FocusSession(
                user_id=req.user_id,
                task_name=task,
                start_time=datetime.utcnow(),
                is_active=True
            )
            db.add(session)
            db.commit()
            result = f"✅ Focus session started: **{task}**\n\nSay 'stop focus' when done. 🎯"
 
    elif intent == "stop_focus":
        from app.models.models import FocusSession
        active = db.query(FocusSession).filter(
            FocusSession.user_id == req.user_id,
            FocusSession.is_active == True
        ).first()
        if active:
            active.end_time = datetime.utcnow()
            active.is_active = False
            active.duration_seconds = int((active.end_time - active.start_time).total_seconds())
            db.commit()
            mins = active.duration_seconds // 60
            result = f"🏁 Session complete: **{active.task_name}**\n\nDuration: {mins} minutes. Saved! 💪"
        else:
            result = "No active session found. Say 'start focus session' to begin."
 
    elif intent == "weekly_report":
        from app.routes.reports import get_weekly_stats
        stats = get_weekly_stats(db, req.user_id)
        result = await generate_productivity_insights(stats)
 
    elif intent == "set_preference":
        import json as _json
        from app.models.models import UserPreference
        pref_data = await extract_preference(req.command)
        value_str = _json.dumps(pref_data.get("value", "")) if not isinstance(pref_data.get("value"), str) else pref_data["value"]
 
        existing = (
            db.query(UserPreference)
            .filter(
                UserPreference.user_id == req.user_id,
                UserPreference.pref_type == pref_data["pref_type"],
                UserPreference.key == pref_data["key"],
            )
            .first()
        )
        if existing:
            existing.value = value_str
        else:
            db.add(UserPreference(
                user_id=req.user_id,
                pref_type=pref_data["pref_type"],
                key=pref_data["key"],
                value=value_str,
            ))
        db.commit()
        result = f"Preference saved: {pref_data.get('summary', pref_data['key'])}. This will be applied to future content filtering."
 
    elif intent == "adjust_priority":
        import json as _json
        from app.models.models import UserPreference
        rule = await extract_priority_rule(req.command)
        value_str = _json.dumps(rule.get("value", "")) if not isinstance(rule.get("value"), str) else rule["value"]
 
        existing = (
            db.query(UserPreference)
            .filter(
                UserPreference.user_id == req.user_id,
                UserPreference.pref_type == "priority_rule",
                UserPreference.key == rule.get("key", "custom"),
            )
            .first()
        )
        if existing:
            try:
                old_vals = _json.loads(existing.value) if existing.value.startswith("[") else [existing.value]
            except _json.JSONDecodeError:
                old_vals = [existing.value]
            new_vals = _json.loads(value_str) if value_str.startswith("[") else [value_str]
            merged = list(set(old_vals + new_vals))
            existing.value = _json.dumps(merged)
        else:
            db.add(UserPreference(
                user_id=req.user_id,
                pref_type="priority_rule",
                key=rule.get("key", "custom"),
                value=value_str,
            ))
        db.commit()
        result = f"Priority rule saved: {rule.get('summary', 'Updated')}. This will affect future message ranking."
 
    elif intent == "productivity_tips":
        result = await call_ai(
            req.command,
            system="You are a productivity coach. Give specific, actionable advice based on the user's request. Be encouraging and practical."
        )
 
    else:
        result = await call_ai(
            req.command,
            system="You are a helpful AI productivity assistant. Answer the user's question concisely and practically. Format with emojis where appropriate."
        )
 
    history = CommandHistory(
        user_id=req.user_id,
        command=req.command,
        intent=intent,
        result=result
    )
    db.add(history)
    db.commit()
 
    return {"result": result, "intent": intent}
