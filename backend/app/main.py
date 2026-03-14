from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import command, emails, focus, activity, news, reports, auth

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Life Efficiency API",
    description="Backend API for AI productivity assistant",
    version="1.0.0"
)

# CORS - allow extension and dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "chrome-extension://*",
        "http://localhost:8000",
        "*"  # For development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(command.router, prefix="/api", tags=["Commands"])
app.include_router(emails.router, prefix="/api", tags=["Emails"])
app.include_router(focus.router, prefix="/api/focus", tags=["Focus"])
app.include_router(activity.router, prefix="/api", tags=["Activity"])
app.include_router(news.router, prefix="/api", tags=["News"])
app.include_router(reports.router, prefix="/api/report", tags=["Reports"])


@app.get("/")
def root():
    return {"message": "AI Life Efficiency API is running!", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
