from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import NewsArticle

router = APIRouter()


class ArticleItem(BaseModel):
    headline: str
    summary: Optional[str] = ""
    url: Optional[str] = ""
    source: Optional[str] = ""
    timestamp: Optional[str] = None


class NewsRequest(BaseModel):
    articles: List[ArticleItem]


@router.post("/news")
def store_news(req: NewsRequest, db: Session = Depends(get_db)):
    stored = 0
    for article in req.articles:
        existing = db.query(NewsArticle).filter(
            NewsArticle.headline == article.headline
        ).first()
        if not existing:
            record = NewsArticle(
                headline=article.headline,
                summary=article.summary,
                url=article.url,
                source=article.source
            )
            db.add(record)
            stored += 1
    db.commit()
    return {"stored": stored}


@router.get("/news")
def get_news(limit: int = 20, db: Session = Depends(get_db)):
    articles = db.query(NewsArticle).order_by(
        NewsArticle.timestamp.desc()
    ).limit(limit).all()
    return [{
        "id": a.id,
        "headline": a.headline,
        "summary": a.summary,
        "url": a.url,
        "source": a.source,
        "timestamp": a.timestamp
    } for a in articles]
