import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, CommandHistory, EmailRecord, NewsArticle
from app.ai.ai_service import (
    call_ai, classify_intent, summarize_emails,
    summarize_news, generate_productivity_insights,
)
from app.safety import (
    create_pending_task, pop_pending_task,
    register_cancel_token, cancel_task, cleanup_cancel_token,
)

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


# ─── Existing endpoint (kept for backward compat with extension) ──────────────

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
        result = await call_ai(
            req.command,
            system="You are a helpful AI productivity assistant. Answer the user's question concisely and practically. Format with emojis where appropriate."
        )

    history = CommandHistory(
        user_id=req.user_id,
        command=req.command,
        intent=intent,
        result=result,
    )
    db.add(history)
    db.commit()

    return {"result": result, "intent": intent}


# ─── Safety Layer: Step 1 — Preview (classification only) ────────────────────

@router.post("/command/preview")
async def preview_command(req: CommandRequest):
    """
    Classify the user's command without executing it.
    Returns a task_id, human-readable description, and step count
    for the confirmation modal.
    """
    intent_data = await classify_intent(req.command)
    intent = intent_data.get("intent", "general_question")
    task_meta = create_pending_task(req.user_id, req.command, intent)
    return {"intent": intent, **task_meta}


# ─── Safety Layer: Step 2 — Stream (SSE execution) ───────────────────────────

@router.get("/command/stream/{task_id}")
async def stream_command(task_id: str, user_id: str, db: Session = Depends(get_db)):
    """
    Execute a confirmed task, streaming Server-Sent Events with progress updates.

    SSE event shape:
      { step, total, message, percent }           — progress update
      { step, total, message, percent, result }   — final success event
      { cancelled: true, message }                — user cancelled
      { error, message }                          — unhandled error
    """
    task_info = pop_pending_task(task_id)
    if not task_info:
        raise HTTPException(status_code=404, detail="Task not found or already executed")
    if task_info["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    cancel = register_cancel_token(task_id)
    get_or_create_user(db, user_id)

    def sse(data: dict) -> str:
        return f"data: {json.dumps(data)}\n\n"

    async def event_generator():
        intent = task_info["intent"]
        command = task_info["command"]
        result = ""

        try:
            # ── summarize_emails ──────────────────────────────────────────────
            if intent == "summarize_emails":
                yield sse({"step": 1, "total": 4, "message": "Fetching your recent emails...", "percent": 10})
                await asyncio.sleep(0)          # yield to event loop
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                emails = db.query(EmailRecord).filter(
                    EmailRecord.user_id == user_id
                ).order_by(EmailRecord.created_at.desc()).limit(20).all()
                email_list = [
                    {"sender": e.sender, "sender_name": e.sender_name,
                     "subject": e.subject, "snippet": e.snippet}
                    for e in emails
                ]

                yield sse({"step": 2, "total": 4, "message": "Analyzing email content...", "percent": 35})
                await asyncio.sleep(0)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 3, "total": 4, "message": "Generating AI summary...", "percent": 65})
                result = await summarize_emails(email_list)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 4, "total": 4, "message": "Summary ready!", "percent": 100, "result": result})

            # ── daily_news ────────────────────────────────────────────────────
            elif intent == "daily_news":
                yield sse({"step": 1, "total": 3, "message": "Fetching latest news articles...", "percent": 15})
                await asyncio.sleep(0)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                articles = db.query(NewsArticle).order_by(
                    NewsArticle.timestamp.desc()
                ).limit(20).all()
                article_list = [
                    {"headline": a.headline, "summary": a.summary, "source": a.source}
                    for a in articles
                ]

                yield sse({"step": 2, "total": 3, "message": "Generating AI news digest...", "percent": 55})
                result = await summarize_news(article_list)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 3, "total": 3, "message": "News digest ready!", "percent": 100, "result": result})

            # ── weekly_report ─────────────────────────────────────────────────
            elif intent == "weekly_report":
                yield sse({"step": 1, "total": 4, "message": "Gathering weekly activity data...", "percent": 10})
                await asyncio.sleep(0)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                from app.routes.reports import get_weekly_stats
                stats = get_weekly_stats(db, user_id)

                yield sse({"step": 2, "total": 4, "message": "Calculating productivity metrics...", "percent": 35})
                await asyncio.sleep(0)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 3, "total": 4, "message": "Generating AI insights...", "percent": 65})
                result = await generate_productivity_insights(stats)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 4, "total": 4, "message": "Report ready!", "percent": 100, "result": result})

            # ── productivity_tips ─────────────────────────────────────────────
            elif intent == "productivity_tips":
                yield sse({"step": 1, "total": 3, "message": "Processing your request...", "percent": 20})
                await asyncio.sleep(0)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 2, "total": 3, "message": "Generating productivity advice...", "percent": 55})
                result = await call_ai(
                    command,
                    system="You are a productivity coach. Give specific, actionable advice. Be encouraging and practical."
                )
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 3, "total": 3, "message": "Advice ready!", "percent": 100, "result": result})

            # ── general_question (default) ────────────────────────────────────
            else:
                yield sse({"step": 1, "total": 3, "message": "Processing your request...", "percent": 20})
                await asyncio.sleep(0)
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 2, "total": 3, "message": "Generating AI response...", "percent": 55})
                result = await call_ai(
                    command,
                    system="You are a helpful AI productivity assistant. Answer concisely and practically. Use emojis where appropriate."
                )
                if cancel.is_set():
                    yield sse({"cancelled": True, "message": "Task stopped by user."})
                    return

                yield sse({"step": 3, "total": 3, "message": "Response ready!", "percent": 100, "result": result})

            # Persist to command history (only if task completed)
            if result:
                history = CommandHistory(
                    user_id=user_id,
                    command=command,
                    intent=intent,
                    result=result,
                )
                db.add(history)
                db.commit()

        except Exception as e:
            yield sse({"error": str(e), "message": f"Error: {str(e)}", "percent": 0})

        finally:
            cleanup_cancel_token(task_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable nginx buffering
        },
    )


# ─── Safety Layer: Step 3 — Cancel (kill switch) ─────────────────────────────

@router.post("/command/cancel/{task_id}")
async def cancel_command(task_id: str):
    """
    Set the cancellation token for a running task, or discard a pending task.
    The executing SSE generator checks cancel.is_set() between steps and stops cleanly.
    """
    cancelled = cancel_task(task_id)
    return {
        "status": "cancelled" if cancelled else "not_found",
        "task_id": task_id,
    }
