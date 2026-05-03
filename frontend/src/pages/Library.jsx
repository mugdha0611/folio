import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AddBookModal from '../components/AddBookModal'
import './Library.css'

function Library() {
  const [books, setBooks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const fetchBooks = async () => {
    try {
      const res = await axios.get('http://localhost:8000/books/')
      setBooks(res.data)
    } catch (err) {
      console.error('Failed to fetch books', err)
    }
  }

  useEffect(() => { fetchBooks() }, [])

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>My Library</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Book
        </button>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <p>📚</p>
          <p>No books yet.</p>
          <p>Add your first one to get started.</p>
        </div>
      ) : (
        <div className="book-grid">
          {books.map(book => (
            <div
              key={book.id}
              className="book-card"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} />
              ) : (
                <div className="no-cover-card">📚</div>
              )}
              <div className="book-card-info">
                <span className="book-title">{book.title}</span>
                <span className="book-author">{book.author}</span>
                {book.rating && (
                  <span className="book-rating">
                    {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddBookModal
          onClose={() => setShowModal(false)}
          onBookAdded={fetchBooks}
        />
      )}
    </div>
  )
}

export default Library