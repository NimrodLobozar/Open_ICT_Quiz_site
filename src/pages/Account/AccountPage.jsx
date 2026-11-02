import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/http.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Avatar, Notice, SkillBars, StatTiles } from '../../components/AccountUi.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import { formatDay, formatMonthYear, formatPlace } from '../../utils/formatDate.js'
import { formatScore } from '../../utils/formatScore.js'
import './Account.css'

const ROLE_LABEL = { STUDENT: 'Student', TEACHER: 'Docent', ADMIN: 'Beheerder' }

/**
 * /account: "Mijn account" (story 4), design "4 · Mijn account" en "6 · telefoon".
 * Profielkaart, cijfertegels, vaardigheden en de laatst gespeelde quizzen.
 * De plaatsen komen uit de database: een momentopname van getRanking() op het podium.
 */
export default function AccountPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api(`/me/results${showAll ? '?all=1' : ''}`)
      .then((result) => !cancelled && setData(result))
      .catch((apiError) => !cancelled && setError(apiError.message))
    return () => {
      cancelled = true
    }
  }, [showAll])

  const summary = data?.summary
  const stats = summary && [
    { value: summary.played, label: 'Quizzen gespeeld' },
    { value: `${summary.podiumCount}×`, label: 'Op het podium' },
    { value: formatPlace(summary.bestRank), label: 'Beste plaats' },
    { value: summary.correctPercent == null ? '–' : `${summary.correctPercent}%`, label: 'Goede antwoorden' },
  ]

  return (
    <div className="page account-page">
      <QuizHeader />
      <main className="page__main account-page__main">
        <section aria-label="Profiel" className="ui-card account-page__profile">
          <Avatar name={user.username} />
          <div className="account-page__who">
            <span className="ui-kicker account-page__since">
              {ROLE_LABEL[user.role]} · lid sinds {formatMonthYear(user.createdAt)}
            </span>
            <h1 className="ui-title">{user.username.toUpperCase()}</h1>
            <span className="account-page__email">{user.email}</span>
          </div>
          <div className="account-page__actions">
            <Link to="/account/instellingen" className="ui-btn">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4L19 9l-4-4L4 16z" />
                <path d="M13 7l4 4" />
              </svg>
              Profiel bewerken
            </Link>
            <Link to="/join" className="ui-btn ui-btn--primary">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l13 8-13 8z" />
              </svg>
              Meedoen met code
            </Link>
          </div>
        </section>

        <Notice>{error}</Notice>

        <section aria-labelledby="account-stats" className="account-page__section">
          <h2 id="account-stats" className="ui-section-title">
            Jouw cijfers
          </h2>
          {stats ? <StatTiles stats={stats} /> : !error && <p role="status">Laden…</p>}
        </section>

        <div className="account-page__columns">
          <section aria-labelledby="account-skills" className="ui-card account-page__skills">
            <div className="account-page__section-top">
              <h2 id="account-skills" className="ui-section-title">
                Vaardigheden
              </h2>
              <Link to="/account/instellingen#vaardigheden" className="ui-link account-page__small-link">
                Aanpassen
              </Link>
            </div>
            <SkillBars skills={user.skills} />
          </section>

          <section aria-labelledby="account-recent" className="ui-card account-page__recent">
            <h2 id="account-recent" className="ui-section-title">
              Laatst gespeeld
            </h2>
            {data && data.total === 0 && (
              // Lege staat (story 4): geen fout, maar uitleg wat je moet doen.
              <div className="account-page__empty">
                <p>
                  <strong>Je hebt nog geen quiz gespeeld met je account.</strong>
                </p>
                <p>Doe mee met een code terwijl je bent ingelogd; je uitslag komt dan hier te staan.</p>
                <Link to="/join" className="ui-btn ui-btn--primary ui-btn--small">
                  Meedoen met code
                </Link>
              </div>
            )}
            {data && data.total > 0 && (
              <>
                <ul className="account-page__games">
                  {data.results.map((game) => (
                    <li key={game.id} className={`account-page__game ${game.rank === 1 ? 'is-first' : ''}`}>
                      <span className="account-page__place">
                        {formatPlace(game.rank)}
                        <span className="ui-sr-only"> plaats</span>
                      </span>
                      <span className="account-page__game-info">
                        <strong>{game.quizTitle}</strong>
                        <span>
                          {formatDay(game.playedAt)} · {game.playerCount} spelers · {game.correctCount}/{game.questionCount} goed
                        </span>
                      </span>
                      <strong className="account-page__score">
                        {formatScore(game.score)}
                        <span className="ui-sr-only"> punten</span>
                      </strong>
                    </li>
                  ))}
                </ul>
                {data.total > data.results.length && (
                  <button type="button" className="ui-btn ui-btn--small account-page__all" onClick={() => setShowAll(true)}>
                    Alle uitslagen ({data.total})
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
