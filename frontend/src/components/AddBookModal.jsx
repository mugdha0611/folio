import { useState } from 'react'
import axios from 'axios'
import './AddBookModal.css'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function AddBookModal({ onClose, onBookAdded }) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [log, setLog] = useState({
    status: 'read',
    rating: null,
    start_month: null,
    start_year: null,
    end_month: null,
    end_year: null,
    date_confidence: 'exact',
    review: '',
    notes: ''
  })

  // Search Open Library
  const searchBooks = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await axios.get(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,cover_i,first_publish_year,subject`
      )
      setSearchResults(res.data.docs)
    } catch (err) {
      console.error('Search failed', err)
    }
    setSearching(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') searchBooks()
  }

  const selectBook = (book) => {
    setSelectedBook({
      title: book.title,
      author: book.author_name?.[0] || 'Unknown Author',
      open_library_id: book.key,
      cover_url: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : null,
      published_year: book.first_publish_year || null,
      genre: book.subject?.slice(0, 3) || [],
      description: null
    })
    setSearchResults([])
    setQuery('')
  }

  const handleSave = async () => {
    if (!selectedBook) return
    setSaving(true)
    try {
      await axios.post('http://localhost:8000/books/', {
        book: selectedBook,
        log: {
          ...log,
          rating: log.rating ? parseFloat(log.rating) : null,
          start_month: log.start_month ? parseInt(log.start_month) : null,
          start_year: log.start_year ? parseInt(log.start_year) : null,
          end_month: log.end_month ? parseInt(log.end_month) : null,
          end_year: log.end_year ? parseInt(log.end_year) : null,
        }
      })
      onBookAdded()
      onClose()
    } catch (err) {
      console.error('Save failed', err)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedBook ? 'Log your read' : 'Add a book'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Step 1 — Search */}
        {!selectedBook && (
          <div className="modal-search">
            <div className="search-row">
              <input
                type="text"
                placeholder="Search by title or author..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button onClick={searchBooks} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((book, i) => (
                  <div key={i} className="search-result-item" onClick={() => selectBook(book)}>
                    {book.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                        alt={book.title}
                      />
                    ) : (
                      <div className="no-cover">📚</div>
                    )}
                    <div className="result-info">
                      <span className="result-title">{book.title}</span>
                      <span className="result-author">{book.author_name?.[0] || 'Unknown'}</span>
                      {book.first_publish_year && (
                        <span className="result-year">{book.first_publish_year}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Log details */}
        {selectedBook && (
          <div className="modal-log">
            <div className="selected-book">
              {selectedBook.cover_url && (
                <img src={selectedBook.cover_url} alt={selectedBook.title} />
              )}
              <div>
                <h3>{selectedBook.title}</h3>
                <p>{selectedBook.author}</p>
                {selectedBook.published_year && (
                  <p className="year">{selectedBook.published_year}</p>
                )}
              </div>
            </div>

            <div className="log-form">
              {/* Status */}
              <div className="form-group">
                <label>Status</label>
                <div className="status-pills">
                  {['read', 'reading', 'tbr'].map(s => (
                    <button
                      key={s}
                      className={log.status === s ? 'pill active' : 'pill'}
                      onClick={() => setLog({ ...log, status: s })}
                    >
                      {s === 'tbr' ? 'Want to Read' : s === 'reading' ? 'Reading' : 'Read'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="form-group">
                <label>Rating</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={log.rating >= star ? 'star filled' : 'star'}
                      onClick={() => setLog({ ...log, rating: star })}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {/* Dates */}
              {log.status !== 'tbr' && (
                <div className="form-group">
                  <label>When did you read it?</label>
                  <div className="date-row">
                    <select onChange={e => setLog({ ...log, start_month: e.target.value })}>
                      <option value="">Start month</option>
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Start year"
                      onChange={e => setLog({ ...log, start_year: e.target.value })}
                    />
                    <select onChange={e => setLog({ ...log, end_month: e.target.value })}>
                      <option value="">End month</option>
                      {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="End year"
                      onChange={e => setLog({ ...log, end_year: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{marginTop: '8px'}}>
                    <label>Date confidence</label>
                    <div className="status-pills">
                      {['exact', 'approx', 'unknown'].map(d => (
                        <button
                          key={d}
                          className={log.date_confidence === d ? 'pill active' : 'pill'}
                          onClick={() => setLog({ ...log, date_confidence: d })}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Review */}
              <div className="form-group">
                <label>Review</label>
                <textarea
                  placeholder="What did you think?"
                  value={log.review}
                  onChange={e => setLog({ ...log, review: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  placeholder="Any personal notes..."
                  value={log.notes}
                  onChange={e => setLog({ ...log, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedBook(null)}>
                  ← Back
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save to Folio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddBookModal