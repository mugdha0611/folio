# Folio 📚

This is basically LetterBoxd but for books. Being created for personal usage and learning.

It is a taste-aware reading system. Track what you read, understand why you like it, discover what to read next.

Built with FastAPI + React + PostgreSQL, with a recommendation engine powered by text embeddings and graph-based reasoning.

## Importing Your Reading History

The `backend/import_books.py` script parses a markdown book list and bulk imports everything into Folio via the Open Library API.

### Format expected
Books are listed by year with emoji codes for the month completed:

| Emoji | Month |
|-------|-------|
| 💀 | January |
| 🥹 | February |
| 😎 | March |
| 😩 | April |
| 🫡 | May |
| ✨ | June |
| 🦕 | July |
| 🌱 | August |
| 🎀 | September |
| 🎃 | October |
| 🌊 | November |
| ❄️ | December |
| 🚮 | No judgement read (no month) |
| 🔁 | Re-read |

### How to run

Make sure the Folio backend is running first, then:
```bash
cd backend
venv\Scripts\activate
pip install httpx
python import_books.py
```

### What it does
- Parses every book title and strips emojis cleanly
- Searches Open Library for metadata, cover art, and author
- Falls back gracefully if a book isn't found on Open Library
- Sets `date_confidence` to `approx` when month is known, `unknown` when only year is available
- Marks re-reads with a note in the reading log
- Rate limits requests to be polite to Open Library API

## Stack
- **Backend:** FastAPI, PostgreSQL, SQLAlchemy
- **Frontend:** React, Vite
- **ML:** sentence-transformers, Qdrant, NetworkX

## Phases
- [ ] Phase 1 — Book tracker foundation
- [ ] Phase 2 — Embeddings and taste profile
- [ ] Phase 3 — Similarity search and recommendations
- [ ] Phase 4 — Graph modelling and explainability
- [ ] Phase 5 — Inspiration layer and trend signals