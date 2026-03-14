from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import FocusSession, User
from datetime import datetime
import json

router = APIRouter()


class StartFocusRequest(BaseModel):
    user_id: str
    task_name: str


class StopFocusRequest(BaseModel):
    session_id: int


class UpdateFocusRequest(BaseModel):
    session_id: int
    active_tab: str = ""
    elapsed: int = 0


def get_or_create_user(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.post("/start")
def start_focus(req: StartFocusRequest, db: Session = Depends(get_db)):
    get_or_create_user(db, req.user_id)

    # Close any active sessions
    active = db.query(FocusSession).filter(
        FocusSession.user_id == req.user_id,
        FocusSession.is_active == True
    ).all()
    for s in active:
        s.is_active = False
        s.end_time = datetime.now()

    session = FocusSession(
        user_id=req.user_id,
        task_name=req.task_name,
        start_time=datetime.now(),
        is_active=True
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "task_name": session.task_name, "started_at": session.start_time}


@router.post("/stop")
def stop_focus(req: StopFocusRequest, db: Session = Depends(get_db)):
    session = db.query(FocusSession).filter(FocusSession.id == req.session_id).first()
    if not session:
        return {"error": "Session not found"}

    now = datetime.now()
    session.end_time = now
    session.is_active = False
    if session.start_time:
        session.duration_seconds = int((now - session.start_time).total_seconds())

    db.commit()
    return {
        "message": "Session ended",
        "duration_seconds": session.duration_seconds,
        "task_name": session.task_name
    }


@router.post("/update")
def update_focus(req: UpdateFocusRequest, db: Session = Depends(get_db)):
    session = db.query(FocusSession).filter(FocusSession.id == req.session_id).first()
    if not session:
        return {"error": "Session not found"}

    session.duration_seconds = req.elapsed

    # Track active tabs
    tabs = json.loads(session.active_tabs or "[]")
    if req.active_tab and req.active_tab not in tabs:
        tabs.append(req.active_tab)
    session.active_tabs = json.dumps(tabs[-10:])  # keep last 10

    db.commit()
    return {"updated": True}


@router.get("/active/{user_id}")
def get_active_session(user_id: str, db: Session = Depends(get_db)):
    session = db.query(FocusSession).filter(
        FocusSession.user_id == user_id,
        FocusSession.is_active == True
    ).first()
    if not session:
        return {"active": False}
    return {
        "active": True,
        "session_id": session.id,
        "task_name": session.task_name,
        "start_time": session.start_time
    }


@router.get("/history/{user_id}")
def get_focus_history(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user_id,
        FocusSession.is_active == False
    ).order_by(FocusSession.start_time.desc()).limit(limit).all()

    return [{
        "id": s.id,
        "task_name": s.task_name,
        "start_time": s.start_time,
        "end_time": s.end_time,
        "duration_seconds": s.duration_seconds
    } for s in sessions]
