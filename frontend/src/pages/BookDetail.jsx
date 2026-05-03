import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './BookDetail.css'

function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)

  useEffect(() => {
    axios.get(`http://localhost:8000/books/${id}`)
      .then(res => setBook(res.data))
      .catch(err => console.error(err))
  }, [id])

  if (!book) return <div className="loading">Loading...</div>

  const stars = book.rating
    ? '★'.repeat(Math.round(book.rating)) + '☆'.repeat(5 - Math.round(book.rating))
    : null

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const readPeriod = () => {
    if (!book.end_year) return null
    const end = book.end_month ? `${MONTHS[book.end_month - 1]} ${book.end_year}` : `${book.end_year}`
    const start = book.start_month ? `${MONTHS[book.start_month - 1]} ${book.start_year}` : null
    return start ? `${start} → ${end}` : `Finished ${end}`
  }

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate('/library')}>
        ← Back to Library
      </button>

      <div className="detail-hero">
        <div className="detail-cover">
          {book.cover_url
            ? <img src={book.cover_url} alt={book.title} />
            : <div className="no-cover-large">📚</div>
          }
        </div>

        <div className="detail-meta">
          <h1>{book.title}</h1>
          <p className="detail-author">{book.author}</p>

          {book.published_year && (
            <p className="detail-year">{book.published_year}</p>
          )}

          {book.genre?.length > 0 && (
            <div className="genre-pills">
              {book.genre.map((g, i) => (
                <span key={i} className="genre-pill">{g}</span>
              ))}
            </div>
          )}

          {stars && <div className="detail-rating">{stars}</div>}

          {readPeriod() && (
            <p className="detail-period">📅 {readPeriod()}</p>
          )}

          <div className="detail-status">
            <span className={`status-badge ${book.status}`}>
              {book.status === 'tbr' ? 'Want to Read' : book.status === 'reading' ? 'Reading' : 'Read'}
            </span>
          </div>
        </div>
      </div>

      {book.review && (
        <div className="detail-section">
          <h2>My Review</h2>
          <p className="detail-review">{book.review}</p>
        </div>
      )}

      {book.notes && (
        <div className="detail-section">
          <h2>Notes</h2>
          <p className="detail-notes">{book.notes}</p>
        </div>
      )}

      {book.description && (
        <div className="detail-section">
          <h2>About this book</h2>
          <p className="detail-description">{book.description}</p>
        </div>
      )}
    </div>
  )
}

export default BookDetail