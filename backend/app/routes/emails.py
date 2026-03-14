from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import EmailRecord, User

router = APIRouter()


class EmailItem(BaseModel):
    sender: Optional[str] = "Unknown"
    sender_name: Optional[str] = "Unknown"
    subject: Optional[str] = "No subject"
    snippet: Optional[str] = ""
    timestamp: Optional[str] = ""
    is_unread: Optional[bool] = True


class EmailsRequest(BaseModel):
    emails: List[EmailItem]
    user_id: Optional[str] = "default_user"


def get_or_create_user(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id)
        db.add(user)
        db.commit()
    return user


@router.post("/emails")
def store_emails(req: EmailsRequest, db: Session = Depends(get_db)):
    get_or_create_user(db, req.user_id)
    stored = 0

    for email in req.emails:
        # Check for duplicates by subject + sender
        existing = db.query(EmailRecord).filter(
            EmailRecord.user_id == req.user_id,
            EmailRecord.subject == email.subject,
            EmailRecord.sender == email.sender
        ).first()

        if not existing:
            record = EmailRecord(
                user_id=req.user_id,
                sender=email.sender,
                sender_name=email.sender_name,
                subject=email.subject,
                snippet=email.snippet,
                timestamp=email.timestamp,
                is_unread=email.is_unread
            )
            db.add(record)
            stored += 1

    db.commit()
    return {"stored": stored, "total": len(req.emails)}


@router.get("/emails/{user_id}")
def get_emails(user_id: str, limit: int = 20, unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(EmailRecord).filter(EmailRecord.user_id == user_id)
    if unread_only:
        query = query.filter(EmailRecord.is_unread == True)
    emails = query.order_by(EmailRecord.created_at.desc()).limit(limit).all()

    return [{
        "id": e.id,
        "sender": e.sender,
        "sender_name": e.sender_name,
        "subject": e.subject,
        "snippet": e.snippet,
        "timestamp": e.timestamp,
        "is_unread": e.is_unread,
        "summary": e.summary,
        "created_at": e.created_at
    } for e in emails]
