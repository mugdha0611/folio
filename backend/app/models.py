from sqlalchemy import Column, Integer, String, Text, Float, ARRAY, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

# --- Enums ---
class ReadingStatus(str, enum.Enum):
    read = "read"
    reading = "reading"
    tbr = "tbr"

class DateConfidence(str, enum.Enum):
    exact = "exact"
    approx = "approx"
    unknown = "unknown"

class ThemeSource(str, enum.Enum):
    manual = "manual"
    ai_extracted = "ai_extracted"

# --- Models ---
class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    open_library_id = Column(String, unique=True, nullable=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    genre = Column(ARRAY(String), nullable=True)
    published_year = Column(Integer, nullable=True)
    cover_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    reading_logs = relationship("ReadingLog", back_populates="book")
    themes = relationship("Theme", back_populates="book")
    inspirations = relationship("Inspiration", back_populates="book")


class ReadingLog(Base):
    __tablename__ = "reading_logs"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    status = Column(Enum(ReadingStatus), nullable=False, default=ReadingStatus.tbr)
    rating = Column(Float, nullable=True)
    start_month = Column(Integer, nullable=True)
    start_year = Column(Integer, nullable=True)
    end_month = Column(Integer, nullable=True)
    end_year = Column(Integer, nullable=True)
    date_confidence = Column(Enum(DateConfidence), default=DateConfidence.exact)
    review = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    book = relationship("Book", back_populates="reading_logs")
    quotes = relationship("Quote", back_populates="reading_log")
    embedding = relationship("Embedding", back_populates="reading_log", uselist=False)


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    reading_log_id = Column(Integer, ForeignKey("reading_logs.id"), nullable=False)
    text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    personal_note = Column(Text, nullable=True)

    reading_log = relationship("ReadingLog", back_populates="quotes")


class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    name = Column(String, nullable=False)
    source = Column(Enum(ThemeSource), default=ThemeSource.manual)

    book = relationship("Book", back_populates="themes")


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    reading_log_id = Column(Integer, ForeignKey("reading_logs.id"), nullable=False)
    vector = Column(ARRAY(Float), nullable=False)
    model_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reading_log = relationship("ReadingLog", back_populates="embedding")


class Inspiration(Base):
    __tablename__ = "inspirations"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    source = Column(String, nullable=True)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())
    dismissed = Column(Integer, default=0)

    book = relationship("Book", back_populates="inspirations")