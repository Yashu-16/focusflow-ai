from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, CommandHistory, EmailRecord, NewsArticle
from app.ai.ai_service import call_ai, classify_intent, summarize_emails, summarize_news, generate_productivity_insights
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

    # Classify intent
    intent_data = await classify_intent(req.command)
    intent = intent_data.get("intent", "general_question")

    result = ""

    if intent == "summarize_emails":
        # Get recent emails from DB
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

    elif intent == "weekly_report":
        from app.routes.reports import get_weekly_stats
        stats = get_weekly_stats(db, req.user_id)
        result = await generate_productivity_insights(stats)

    elif intent == "productivity_tips":
        result = await call_ai(
            req.command,
            system="You are a productivity coach. Give specific, actionable advice based on the user's request. Be encouraging and practical."
        )

    else:
        # General AI question
        result = await call_ai(
            req.command,
            system="You are a helpful AI productivity assistant. Answer the user's question concisely and practically. Format with emojis where appropriate."
        )

    # Store command history
    history = CommandHistory(
        user_id=req.user_id,
        command=req.command,
        intent=intent,
        result=result
    )
    db.add(history)
    db.commit()

    return {"result": result, "intent": intent}
