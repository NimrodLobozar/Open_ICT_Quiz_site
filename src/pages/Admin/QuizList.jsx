import { Link, useNavigate } from 'react-router-dom'
import { formatDay } from '../../utils/formatDate.js'

const STATUS = {
  READY: { label: 'Klaar', className: 'ui-pill--ready' },
  DRAFT: { label: 'Concept', className: 'ui-pill--draft' },
}

/**
 * Lijst met quizzen: titel, aantal vragen, wanneer gespeeld, status, en de knoppen Bewerken en Hosten (story 7).
 * Een concept kan niet gehost worden: de knop is dan uit (de server weigert het ook).
 * @param {{ quizzes: Array<object>, showOwner?: boolean, onDelete?: (quiz) => void }} props
 */
export default function QuizList({ quizzes, showOwner = false, onDelete }) {
  const navigate = useNavigate()

  if (quizzes.length === 0) {
    return <p className="admin-page__empty">Nog geen quizzen gevonden.</p>
  }

  return (
    <ul className="admin-quizzes">
      {quizzes.map((quiz) => {
        const status = STATUS[quiz.status]
        const meta = [
          `${quiz.questionCount} ${quiz.questionCount === 1 ? 'vraag' : 'vragen'}`,
          quiz.lastPlayedAt ? `gespeeld ${formatDay(quiz.lastPlayedAt)}` : 'nog niet gespeeld',
          showOwner && quiz.owner ? `van ${quiz.owner}` : null,
        ]
        return (
          <li key={quiz.id} className="admin-quizzes__item">
            <span className="admin-quizzes__info">
              <strong>{quiz.title}</strong>
              <span>{meta.filter(Boolean).join(' · ')}</span>
            </span>
            <span className={`ui-pill ${status.className}`}>{status.label}</span>
            <span className="admin-quizzes__actions">
              <Link to={`/admin/quizzen/${quiz.id}`} className="ui-icon-btn" aria-label={`Bewerk ${quiz.title}`}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h4L19 9l-4-4L4 16z" />
                  <path d="M13 7l4 4" />
                </svg>
              </Link>
              {onDelete && (
                <button type="button" className="ui-icon-btn ui-icon-btn--danger" aria-label={`Verwijder ${quiz.title}`} onClick={() => onDelete(quiz)}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="ui-btn ui-btn--primary ui-btn--small"
                disabled={quiz.status !== 'READY'}
                title={quiz.status !== 'READY' ? 'Zet de quiz eerst op Klaar' : undefined}
                aria-label={`Host ${quiz.title}`}
                onClick={() => navigate(`/host/new?quiz=${quiz.id}`)}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 4l13 8-13 8z" />
                </svg>
                Hosten
              </button>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
