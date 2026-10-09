import { Link } from 'react-router-dom'

// Tijdelijke pagina voor links naar iets dat nog niet bestaat (accounts komen bij L1).
export default function PlaceholderPage({ title }) {
  return (
    <main style={{ padding: 32, fontFamily: "'Rubik', sans-serif", color: '#7c2d12' }}>
      <h1>{title}</h1>
      <p>Accounts komen later (L1). Deze pagina is nog niet gebouwd.</p>
      <Link to="/">Terug naar start</Link>
    </main>
  )
}
