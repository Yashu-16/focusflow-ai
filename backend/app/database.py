import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_efficiency.db")

# If someone left the PostgreSQL URL in .env without having PostgreSQL,
# fall back to SQLite automatically
if DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres"):
    try:
        import psycopg2  # noqa
        # psycopg2 is available, keep PostgreSQL URL
    except ImportError:
        print("[WARNING] psycopg2 not installed. Falling back to SQLite.")
        DATABASE_URL = "sqlite:///./ai_efficiency.db"

# SQLite needs check_same_thread=False
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

print(f"[DB] Using database: {DATABASE_URL[:50]}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
