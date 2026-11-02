import { App as AntApp } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/http.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Avatar, Notice, Toggle } from '../../components/AccountUi.jsx'
import { formatAgo } from '../../utils/formatDate.js'
import { PasswordForm, ProfileForm } from '../Account/AccountForms.jsx'
import AdminLayout from './AdminLayout.jsx'

const TIME_OPTIONS = [10, 20, 30, 60]
const ROLE_LABEL = { TEACHER: 'Docent', ADMIN: 'Beheerder' }

/**
 * /admin/account: Mijn account voor docent en beheerder. Design "9 · Admin — mijn account".
 * Gegevens (story 5), standaard voor nieuwe quizzen (story 8) en ingelogde apparaten (story 9).
 */
export default function AdminAccountPage() {
  const { user } = useAuth()
  const { message } = AntApp.useApp()

  return (
    <AdminLayout kicker={ROLE_LABEL[user.role]} title="MIJN ACCOUNT">
      <section aria-label="Profiel" className="ui-card admin-account__profile">
        <Avatar name={user.username} />
        <div>
          <span className={`ui-pill ${user.role === 'ADMIN' ? 'ui-pill--admin' : 'ui-pill--teacher'}`}>{ROLE_LABEL[user.role]}</span>
          <h2 className="ui-title admin-account__name">{user.username.toUpperCase()}</h2>
          <span className="admin-account__email">{user.email}</span>
        </div>
      </section>

      <div className="admin-account__grid">
        <section aria-labelledby="details-title" className="ui-card admin-page__panel">
          <h2 id="details-title" className="ui-section-title">
            Gegevens
          </h2>
          <ProfileForm onSaved={() => message.success('Opgeslagen.')} />
          <h3 className="ui-section-title admin-account__subtitle">Wachtwoord wijzigen</h3>
          <PasswordForm onSaved={() => message.success('Je wachtwoord is gewijzigd. Op andere apparaten ben je uitgelogd.')} />
        </section>

        <div className="admin-account__column">
          <QuizDefaults />
          <Sessions />
        </div>
      </div>
    </AdminLayout>
  )
}

/** Story 8: standaardinstellingen voor nieuwe quizzen. Bestaande quizzen veranderen niet mee. */
function QuizDefaults() {
  const { message } = AntApp.useApp()
  const [defaults, setDefaults] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/me/quiz-defaults')
      .then((data) => setDefaults(data.defaults))
      .catch((apiError) => setError(apiError.message))
  }, [])

  async function save() {
    setBusy(true)
    try {
      const data = await api('/me/quiz-defaults', { method: 'PUT', body: defaults })
      setDefaults(data.defaults)
      message.success('Standaardinstellingen opgeslagen. Ze gelden voor nieuwe quizzen.')
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  const set = (key) => (value) => setDefaults((current) => ({ ...current, [key]: value }))
  return (
    <section aria-labelledby="defaults-title" className="ui-card admin-page__panel">
      <h2 id="defaults-title" className="ui-section-title">
        Standaard voor nieuwe quizzen
      </h2>
      <Notice>{error}</Notice>
      {defaults && (
        <>
          <label className="ui-field">
            <span className="ui-label">Tijd per vraag</span>
            <select className="ui-select" value={defaults.timePerQuestion} onChange={(e) => set('timePerQuestion')(Number(e.target.value))}>
              {TIME_OPTIONS.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} seconden
                </option>
              ))}
            </select>
          </label>
          <Toggle label="Goede antwoord tonen na elke vraag" checked={defaults.showCorrectAnswer} onChange={set('showCorrectAnswer')} />
          <Toggle label="Tussenstand tonen" checked={defaults.showStandings} onChange={set('showStandings')} />
          <Toggle label="Lobby dicht bij de start" checked={defaults.lockLobbyOnStart} onChange={set('lockLobbyOnStart')} />
          <button type="button" className="ui-btn ui-btn--primary admin-account__save" onClick={save} disabled={busy}>
            {busy ? 'Opslaan…' : 'Opslaan'}
          </button>
        </>
      )}
    </section>
  )
}

/** Story 9: op welke apparaten ben ik ingelogd, en overal uitloggen. Geen IP-adressen, alleen het soort apparaat. */
function Sessions() {
  const { message } = AntApp.useApp()
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    api('/me/sessions')
      .then((data) => setSessions(data.sessions))
      .catch((apiError) => setError(apiError.message))
  }, [])
  useEffect(load, [load])

  async function revokeOthers() {
    try {
      const data = await api('/me/sessions/revoke-others', { method: 'POST' })
      message.success(data.revoked === 1 ? 'Uitgelogd op 1 ander apparaat.' : `Uitgelogd op ${data.revoked} andere apparaten.`)
      load()
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  return (
    <section aria-labelledby="sessions-title" className="ui-card admin-page__panel">
      <div className="admin-page__toolbar">
        <h2 id="sessions-title" className="ui-section-title">
          Ingelogd op
        </h2>
        <button type="button" className="ui-btn ui-btn--small" onClick={revokeOthers} disabled={!sessions || sessions.length <= 1}>
          Overal uitloggen
        </button>
      </div>
      <Notice>{error}</Notice>
      <ul className="admin-sessions">
        {sessions?.map((session) => (
          <li key={session.id}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {session.deviceLabel.startsWith('Telefoon') ? (
                <rect x="7" y="2" width="10" height="20" rx="2" />
              ) : (
                <>
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <path d="M2 20h20" />
                </>
              )}
            </svg>
            <span className="admin-sessions__label">{session.deviceLabel}</span>
            {session.current ? <span className="ui-pill ui-pill--ready">Dit apparaat</span> : <span className="admin-table__muted">{formatAgo(session.lastSeenAt)}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
