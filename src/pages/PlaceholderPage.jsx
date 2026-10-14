import { Link } from 'react-router-dom'
import QuizHeader from '../components/QuizHeader.jsx'

// Tijdelijke pagina voor links naar iets dat nog niet bestaat (accounts komen bij L1).
export default function PlaceholderPage({ title }) {
  return (
    <div className="page">
      <QuizHeader />
      <main className="page__main">
        <h1>{title}</h1>
        <p>Accounts komen later (L1). Deze pagina is nog niet gebouwd.</p>
        <Link to="/">Terug naar start</Link>
      </main>
    </div>
  )
}
