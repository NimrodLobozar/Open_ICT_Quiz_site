import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/http.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Notice, StatTiles } from '../../components/AccountUi.jsx'
import { useDebounced } from '../../hooks/useDebounced.js'
import AdminLayout from './AdminLayout.jsx'
import QuizList from './QuizList.jsx'
import SearchField from './SearchField.jsx'

/** De knop "Nieuwe quiz", ook gebruikt op de pagina Quizzen. */
export function NewQuizButton() {
  return (
    <Link to="/admin/quizzen/nieuw" className="ui-btn ui-btn--primary">
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Nieuwe quiz
    </Link>
  )
}

/** /admin: overzicht voor docent en beheerder (story 7), design "7 · Admin — overzicht & quizzen". */
export default function OverviewPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [quizzes, setQuizzes] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  const query = useDebounced(search)

  useEffect(() => {
    api('/admin/stats')
      .then(setStats)
      .catch((apiError) => setError(apiError.message))
  }, [])

  useEffect(() => {
    let cancelled = false
    api(`/quizzes?q=${encodeURIComponent(query)}`)
      .then((data) => !cancelled && setQuizzes(data.quizzes))
      .catch((apiError) => !cancelled && setError(apiError.message))
    return () => {
      cancelled = true
    }
  }, [query])

  const tiles = stats && [
    { value: stats.quizzes, label: user.role === 'ADMIN' ? 'Quizzen' : 'Mijn quizzen' },
    { value: stats.users, label: 'Gebruikers' },
    { value: stats.roundsThisWeek, label: 'Rondes deze week' },
    { value: stats.correctPercent == null ? '–' : `${stats.correctPercent}%`, label: 'Gem. goed beantwoord' },
  ]

  return (
    <AdminLayout
      kicker={`${user.role === 'ADMIN' ? 'Beheerder' : 'Docent'} · Open ICT`}
      title={`HOI ${user.username.split(' ')[0].toUpperCase()}!`}
      action={<NewQuizButton />}
    >
      <Notice>{error}</Notice>
      {tiles && <StatTiles stats={tiles} label="Cijfers" />}
      <section aria-labelledby="my-quizzes" className="ui-card admin-page__panel">
        <div className="admin-page__toolbar">
          <h2 id="my-quizzes" className="ui-section-title">
            {user.role === 'ADMIN' ? 'Alle quizzen' : 'Mijn quizzen'}
          </h2>
          <SearchField label="Zoek een quiz" value={search} onChange={setSearch} />
        </div>
        {quizzes ? <QuizList quizzes={quizzes} showOwner={user.role === 'ADMIN'} /> : <p role="status">Laden…</p>}
      </section>
    </AdminLayout>
  )
}
