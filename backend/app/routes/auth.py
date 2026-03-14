from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class UserInit(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None


@router.post("/init")
def init_user(req: UserInit):
    """Initialize a user session - simple for now"""
    return {"user_id": req.user_id, "status": "initialized"}


@router.get("/status")
def auth_status():
    return {"authenticated": True, "mode": "local"}
