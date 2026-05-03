import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Library from './pages/Library'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App