from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    focus_sessions = relationship("FocusSession", back_populates="user")
    emails = relationship("EmailRecord", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    commands = relationship("CommandHistory", back_populates="user")


class FocusSession(Base):
    __tablename__ = "focus_sessions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    task_name = Column(String)
    start_time = Column(DateTime, server_default=func.now())
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    active_tabs = Column(Text, default="[]")
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="focus_sessions")


class EmailRecord(Base):
    __tablename__ = "emails"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    sender = Column(String)
    sender_name = Column(String)
    subject = Column(String)
    snippet = Column(Text)
    timestamp = Column(String)
    is_unread = Column(Boolean, default=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="emails")


class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    activity_type = Column(String)
    url = Column(String, nullable=True)
    duration = Column(Integer, default=0)
    timestamp = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="activities")


class NewsArticle(Base):
    __tablename__ = "news_articles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    headline = Column(String)
    summary = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    url = Column(String)
    source = Column(String)
    timestamp = Column(DateTime, server_default=func.now())


class CommandHistory(Base):
    __tablename__ = "command_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    command = Column(Text)
    intent = Column(String, nullable=True)
    result = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="commands")
