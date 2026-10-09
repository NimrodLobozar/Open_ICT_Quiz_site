import { Link } from 'react-router-dom'
import './QuizHeader.css'

/**
 * Bovenbalk voor de speler: logo, spelcode en inloggen (of je accountnaam).
 * De kleuren (--quiz-*) komen van de pagina.
 * @param {{ code: string, accountName?: string | null }} props
 *   accountName blijft null tot er accounts zijn (L1).
 */
export default function QuizHeader({ code, accountName = null }) {
  return (
    <nav className="quiz-header" aria-label="Hoofdmenu">
      <Link to="/" className="quiz-header__logo">
        OPEN ICT QUIZ
      </Link>
      <div className="quiz-header__right">
        <span className="quiz-header__code">
          <span className="quiz-header__code-label">Code </span>
          <strong>{code}</strong>
        </span>
        {/* TODO(team, L1): naar de echte login- en profielpagina zodra accounts er zijn. */}
        <Link to={accountName ? '/profiel' : '/login'} className="quiz-header__account">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
          </svg>
          <span className="quiz-header__account-text">{accountName ?? 'Inloggen'}</span>
        </Link>
      </div>
    </nav>
  )
}
