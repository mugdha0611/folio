import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">folio</Link>
      </div>
      <div className="navbar-links">
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">Home</Link>
        <Link className={location.pathname === '/library' ? 'active' : ''} to="/library">My Library</Link>
        <Link to="/library" className="nav-add-btn">+ Add Book</Link>
      </div>
    </nav>
  )
}

export default Navbar