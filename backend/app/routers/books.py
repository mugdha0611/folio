from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import Book, ReadingLog, ReadingStatus, DateConfidence

router = APIRouter(prefix="/books", tags=["books"])

# --- Schemas ---
class BookCreate(BaseModel):
    title: str
    author: str
    open_library_id: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    published_year: Optional[int] = None
    genre: Optional[list[str]] = []

class ReadingLogCreate(BaseModel):
    status: ReadingStatus
    rating: Optional[float] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    date_confidence: Optional[DateConfidence] = DateConfidence.exact
    review: Optional[str] = None
    notes: Optional[str] = None

class BookWithLog(BaseModel):
    book: BookCreate
    log: ReadingLogCreate

# --- Routes ---
@router.post("/")
def add_book(payload: BookWithLog, db: Session = Depends(get_db)):
    # Check if book already exists
    existing = db.query(Book).filter(
        Book.open_library_id == payload.book.open_library_id
    ).first()

    if existing:
        book = existing
    else:
        book = Book(**payload.book.model_dump())
        db.add(book)
        db.flush()  # get the book id without committing

    # Create reading log
    log = ReadingLog(book_id=book.id, **payload.log.model_dump())
    db.add(log)
    db.commit()
    db.refresh(book)

    return {"message": "Book added successfully", "book_id": book.id}


@router.get("/")
def get_books(db: Session = Depends(get_db)):
    books = db.query(Book).all()
    result = []
    for book in books:
        latest_log = book.reading_logs[-1] if book.reading_logs else None
        result.append({
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "cover_url": book.cover_url,
            "published_year": book.published_year,
            "genre": book.genre,
            "status": latest_log.status if latest_log else None,
            "rating": latest_log.rating if latest_log else None,
        })
    return result


@router.get("/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    latest_log = book.reading_logs[-1] if book.reading_logs else None
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "cover_url": book.cover_url,
        "description": book.description,
        "published_year": book.published_year,
        "genre": book.genre,
        "status": latest_log.status if latest_log else None,
        "rating": latest_log.rating if latest_log else None,
        "review": latest_log.review if latest_log else None,
        "notes": latest_log.notes if latest_log else None,
        "start_month": latest_log.start_month if latest_log else None,
        "start_year": latest_log.start_year if latest_log else None,
        "end_month": latest_log.end_month if latest_log else None,
        "end_year": latest_log.end_year if latest_log else None,
    }