from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Activity, User

router = APIRouter()


class ActivityRequest(BaseModel):
    user_id: Optional[str] = "default_user"
    activity_type: str
    url: Optional[str] = ""
    duration: Optional[int] = 0
    timestamp: Optional[str] = None


def get_or_create_user(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id)
        db.add(user)
        db.commit()
    return user


@router.post("/activity")
def track_activity(req: ActivityRequest, db: Session = Depends(get_db)):
    get_or_create_user(db, req.user_id)
    activity = Activity(
        user_id=req.user_id,
        activity_type=req.activity_type,
        url=req.url,
        duration=req.duration
    )
    db.add(activity)
    db.commit()
    return {"tracked": True}


@router.get("/activity/{user_id}")
def get_activity(user_id: str, limit: int = 50, db: Session = Depends(get_db)):
    activities = db.query(Activity).filter(
        Activity.user_id == user_id
    ).order_by(Activity.timestamp.desc()).limit(limit).all()

    return [{
        "id": a.id,
        "activity_type": a.activity_type,
        "url": a.url,
        "duration": a.duration,
        "timestamp": a.timestamp
    } for a in activities]
