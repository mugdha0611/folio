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
class ReadingLogUpdate(BaseModel):
    status: Optional[ReadingStatus] = None
    rating: Optional[float] = None
    start_month: Optional[int] = None
    start_year: Optional[int] = None
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    date_confidence: Optional[DateConfidence] = None
    review: Optional[str] = None
    notes: Optional[str] = None

class ThemeAdd(BaseModel):
    name: str
    source: Optional[str] = "manual"

@router.patch("/{book_id}")
def update_book(book_id: int, payload: ReadingLogUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    log = book.reading_logs[-1] if book.reading_logs else None
    if not log:
        raise HTTPException(status_code=404, detail="No reading log found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(log, key, value)
    
    db.commit()
    db.refresh(log)
    return {"message": "Updated successfully"}


@router.post("/{book_id}/themes")
def add_theme(book_id: int, payload: ThemeAdd, db: Session = Depends(get_db)):
    from ..models import Theme, ThemeSource
    theme = Theme(
        book_id=book_id,
        name=payload.name,
        source=ThemeSource.manual
    )
    db.add(theme)
    db.commit()
    return {"message": "Theme added"}


@router.get("/{book_id}/themes")
def get_themes(book_id: int, db: Session = Depends(get_db)):
    from ..models import Theme
    themes = db.query(Theme).filter(Theme.book_id == book_id).all()
    return [{"id": t.id, "name": t.name, "source": t.source} for t in themes]

@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Delete related records first (foreign key constraints)
    from ..models import Theme, Inspiration, ReadingLog, Quote, Embedding
    
    for log in book.reading_logs:
        db.query(Quote).filter(Quote.reading_log_id == log.id).delete()
        db.query(Embedding).filter(Embedding.reading_log_id == log.id).delete()
    
    db.query(ReadingLog).filter(ReadingLog.book_id == book_id).delete()
    db.query(Theme).filter(Theme.book_id == book_id).delete()
    db.query(Inspiration).filter(Inspiration.book_id == book_id).delete()
    db.delete(book)
    db.commit()
    
    return {"message": "Book deleted"}