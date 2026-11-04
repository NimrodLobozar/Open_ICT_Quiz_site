import { App as AntApp } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { initials, isStaff, useAuth } from '../auth/AuthContext.jsx'
import './QuizHeader.css'

/**
 * Navigatiebalk bovenaan elke pagina: logo, spelcode, en inloggen of je account + uitloggen.
 * De kleuren (--quiz-*) komen uit src/index.css. Wie er is ingelogd, komt uit useAuth().
 * @param {{ code?: string | null, large?: boolean, admin?: boolean }} props
 *   code: alleen tijdens een spel; zonder code wordt het vakje niet getoond.
 *   large: grotere letters voor het grote scherm van de host (digibord).
 *   admin: het label "BEHEER" naast het logo (admin-portaal).
 */
export default function QuizHeader({ code = null, large = false, admin = false }) {
  const { user, logout } = useAuth()
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Op het inlogscherm zelf heeft een knop "Inloggen" geen zin; dan bieden we meedoen met een code aan.
  const onAuthPage = ['/inloggen', '/registreren'].includes(pathname)

  async function handleLogout() {
    try {
      await logout()
      navigate('/inloggen', { replace: true })
    } catch {
      // Niet doen alsof het gelukt is: je bent op de server nog ingelogd.
      message.error('Uitloggen is niet gelukt. Controleer je internetverbinding en probeer het opnieuw.')
    }
  }

  // Docenten en beheerders gaan naar hun account in het beheerportaal, studenten naar Mijn account.
  const profilePath = isStaff(user) ? '/admin/account' : '/account'

  return (
    <nav className={`quiz-header ${large ? 'quiz-header--large' : ''}`} aria-label="Hoofdmenu">
      <span className="quiz-header__brand">
        {/* Het logo gaat altijd naar de startpagina, ook ingelogd. Je account zit al achter de knop met je naam. */}
        <Link to="/" className="quiz-header__logo">
          OPEN ICT QUIZ
        </Link>
        {admin && <span className="quiz-header__badge">BEHEER</span>}
      </span>
      <div className="quiz-header__right">
        {code && (
          <span className="quiz-header__code">
            <span className="quiz-header__code-label">Code </span>
            <strong>{code}</strong>
          </span>
        )}
        <button type="button" className={`quiz-header__account ${pathname === '/leaderboard' ? 'is-current' : ''}`} onClick={() => navigate('/leaderboard')}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16" />
            <path d="M5 20v-6h4v6" />
            <path d="M10 20V8h4v12" />
            <path d="M15 20V4h4v16" />
          </svg>
          <span className="quiz-header__account-text">Leaderboard</span>
        </button>
        {user ? (
          <>
            <Link
              to={profilePath}
              className={`quiz-header__account quiz-header__account--user ${pathname === profilePath ? 'is-current' : ''}`}
              aria-current={pathname === profilePath ? 'page' : undefined}
            >
              <span aria-hidden="true" className="quiz-header__avatar">
                {initials(user.username)}
              </span>
              <span className="quiz-header__account-text">{isStaff(user) ? 'Profiel' : user.username}</span>
            </Link>
            <button type="button" className="quiz-header__account" onClick={handleLogout}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 4h4v16h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              <span className="quiz-header__account-text">Uitloggen</span>
            </button>
          </>
        ) : onAuthPage ? (
          <Link to="/join" className="quiz-header__account">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4H5v16h4" />
              <path d="M14 7l-5 5 5 5" />
              <path d="M9 12h12" />
            </svg>
            <span className="quiz-header__account-text">Meedoen met code</span>
          </Link>
        ) : (
          <Link to={`/inloggen?terug=${encodeURIComponent(pathname)}`} className="quiz-header__account">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            <span className="quiz-header__account-text">Inloggen</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
