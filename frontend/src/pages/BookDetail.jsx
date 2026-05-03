import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './BookDetail.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [editing, setEditing] = useState(false)
  const [themes, setThemes] = useState([])
  const [newTheme, setNewTheme] = useState('')
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const fetchBook = () => {
    axios.get(`http://localhost:8000/books/${id}`)
      .then(res => {
        setBook(res.data)
        setForm({
          status: res.data.status,
          rating: res.data.rating,
          start_month: res.data.start_month,
          start_year: res.data.start_year,
          end_month: res.data.end_month,
          end_year: res.data.end_year,
          date_confidence: res.data.date_confidence || 'exact',
          review: res.data.review || '',
          notes: res.data.notes || '',
        })
      })
      .catch(err => console.error(err))
  }

  const fetchThemes = () => {
    axios.get(`http://localhost:8000/books/${id}/themes`)
      .then(res => setThemes(res.data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchBook()
    fetchThemes()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.patch(`http://localhost:8000/books/${id}`, {
        ...form,
        rating: form.rating ? parseFloat(form.rating) : null,
        start_month: form.start_month ? parseInt(form.start_month) : null,
        start_year: form.start_year ? parseInt(form.start_year) : null,
        end_month: form.end_month ? parseInt(form.end_month) : null,
        end_year: form.end_year ? parseInt(form.end_year) : null,
      })
      fetchBook()
      setEditing(false)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${book.title}" from Folio?`)) return
    try {
      await axios.delete(`http://localhost:8000/books/${id}`)
      navigate('/library')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddTheme = async () => {
    if (!newTheme.trim()) return
    await axios.post(`http://localhost:8000/books/${id}/themes`, { name: newTheme })
    setNewTheme('')
    fetchThemes()
  }

  if (!book) return <div className="loading">Loading...</div>

  const stars = form.rating
    ? '★'.repeat(Math.round(form.rating)) + '☆'.repeat(5 - Math.round(form.rating))
    : '☆☆☆☆☆'

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
          <div className="detail-title-row">
            <h1>{book.title}</h1>
            <button
              className={editing ? 'edit-btn active' : 'edit-btn'}
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
            >
              {saving ? 'Saving...' : editing ? '✓ Save' : '✎ Edit'}
            </button>
            {editing && (
              <button className="cancel-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
            <button className="delete-btn" onClick={handleDelete}>
              🗑 Delete
            </button>
          </div>

          <p className="detail-author">{book.author}</p>
          {book.published_year && <p className="detail-year">{book.published_year}</p>}

          {editing ? (
            <div className="status-pills">
              {['read', 'reading', 'tbr'].map(s => (
                <button
                  key={s}
                  className={form.status === s ? 'pill active' : 'pill'}
                  onClick={() => setForm({ ...form, status: s })}
                >
                  {s === 'tbr' ? 'Want to Read' : s === 'reading' ? 'Reading' : 'Read'}
                </button>
              ))}
            </div>
          ) : (
            <div className="detail-status">
              <span className={`status-badge ${book.status}`}>
                {book.status === 'tbr' ? 'Want to Read' : book.status === 'reading' ? 'Reading' : 'Read'}
              </span>
            </div>
          )}

          {editing ? (
            <div className="stars">
              {[1,2,3,4,5].map(star => (
                <span
                  key={star}
                  className={form.rating >= star ? 'star filled' : 'star'}
                  onClick={() => setForm({ ...form, rating: star })}
                >★</span>
              ))}
            </div>
          ) : (
            <div className="detail-rating">{stars}</div>
          )}

          {editing ? (
            <div className="date-edit">
              <div className="date-row">
                <select
                  value={form.start_month || ''}
                  onChange={e => setForm({ ...form, start_month: e.target.value })}
                >
                  <option value="">Start month</option>
                  {MONTHS_FULL.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Start year"
                  value={form.start_year || ''}
                  onChange={e => setForm({ ...form, start_year: e.target.value })}
                />
                <select
                  value={form.end_month || ''}
                  onChange={e => setForm({ ...form, end_month: e.target.value })}
                >
                  <option value="">End month</option>
                  {MONTHS_FULL.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="End year"
                  value={form.end_year || ''}
                  onChange={e => setForm({ ...form, end_year: e.target.value })}
                />
              </div>
              <div className="status-pills" style={{marginTop: '8px'}}>
                {['exact','approx','unknown'].map(d => (
                  <button
                    key={d}
                    className={form.date_confidence === d ? 'pill active' : 'pill'}
                    onClick={() => setForm({ ...form, date_confidence: d })}
                  >{d}</button>
                ))}
              </div>
            </div>
          ) : (
            readPeriod() && <p className="detail-period">📅 {readPeriod()}</p>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h2>Themes</h2>
        <div className="themes-row">
          {themes.map((t, i) => (
            <span key={i} className={`genre-pill ${t.source === 'ai_extracted' ? 'ai-pill' : ''}`}>
              {t.source === 'ai_extracted' ? '✦ ' : ''}{t.name}
            </span>
          ))}
          <div className="add-theme">
            <input
              type="text"
              placeholder="Add theme..."
              value={newTheme}
              onChange={e => setNewTheme(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTheme()}
            />
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h2>My Review</h2>
        {editing ? (
          <textarea
            value={form.review}
            onChange={e => setForm({ ...form, review: e.target.value })}
            rows={5}
            placeholder="What did you think?"
          />
        ) : (
          <p className="detail-review">
            {book.review || <span className="empty-field">No review yet. Click Edit to add one.</span>}
          </p>
        )}
      </div>

      <div className="detail-section">
        <h2>Notes</h2>
        {editing ? (
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Personal notes..."
          />
        ) : (
          <p className="detail-notes">
            {book.notes || <span className="empty-field">No notes yet.</span>}
          </p>
        )}
      </div>

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