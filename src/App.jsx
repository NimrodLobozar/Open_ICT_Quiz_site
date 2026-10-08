import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import EndScreenPage from './pages/EndScreenPage.jsx'

// TODO(team): overige routes uit het projectplan (hoofdstuk 7) toevoegen.
// Let op: in de echte flow wordt het eindscherm de laatste fase van /play/:code.
// De losse route /end is er tijdelijk, zodat we het eindscherm los kunnen bouwen en testen.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Link to="/end">Naar het eindscherm (test)</Link>} />
        <Route path="/end" element={<EndScreenPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
