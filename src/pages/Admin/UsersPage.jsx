import { App as AntApp, Modal } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/http.js'
import { Avatar, Notice, TextField } from '../../components/AccountUi.jsx'
import { useDebounced } from '../../hooks/useDebounced.js'
import { formatAgo } from '../../utils/formatDate.js'
import AdminLayout from './AdminLayout.jsx'
import SearchField from './SearchField.jsx'

const ROLES = {
  STUDENT: { label: 'Student', className: '' },
  TEACHER: { label: 'Docent', className: 'ui-pill--teacher' },
  ADMIN: { label: 'Beheerder', className: 'ui-pill--admin' },
}
const FILTERS = [
  ['', 'Alle'],
  ['STUDENT', 'Studenten'],
  ['TEACHER', 'Docenten'],
  ['ADMIN', 'Beheerders'],
]

/** /admin/gebruikers (story 10, 11 en 12), alleen voor beheerders. Design "8 · Admin — gebruikers". */
export default function UsersPage() {
  const { message } = AntApp.useApp()
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const query = useDebounced(search)

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page) })
    if (role) params.set('role', role)
    if (query) params.set('q', query)
    api(`/admin/users?${params}`)
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((apiError) => setError(apiError.message))
  }, [page, role, query])

  useEffect(load, [load])
  // Ander filter of andere zoekterm: terug naar pagina 1.
  useEffect(() => setPage(1), [role, query])

  async function remove() {
    try {
      await api(`/admin/users/${deleting.id}`, { method: 'DELETE' })
      message.success(`${deleting.username} is verwijderd.`)
      setDeleting(null)
      load()
    } catch (apiError) {
      message.error(apiError.message)
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  return (
    <AdminLayout
      kicker={data ? `${data.total} accounts` : ' '}
      title="GEBRUIKERS"
      action={
        <button type="button" className="ui-btn ui-btn--primary" onClick={() => setAdding(true)}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Docent toevoegen
        </button>
      }
    >
      <div className="admin-page__toolbar">
        <div role="group" aria-label="Filter op rol" className="admin-filters">
          {FILTERS.map(([value, label]) => (
            <button key={label} type="button" aria-pressed={role === value} onClick={() => setRole(value)}>
              {label}
            </button>
          ))}
        </div>
        <SearchField label="Zoek op naam of e-mail" value={search} onChange={setSearch} />
      </div>

      <Notice>{error}</Notice>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th scope="col">Naam</th>
              <th scope="col">Rol</th>
              <th scope="col" className="is-number">
                Gespeeld
              </th>
              <th scope="col">Laatst actief</th>
              <th scope="col" className="is-actions">
                Acties
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user.id}>
                <td>
                  <span className="admin-table__person">
                    <Avatar name={user.username} size="small" />
                    <span>
                      <strong>{user.username}</strong>
                      <span>{user.email}</span>
                    </span>
                  </span>
                </td>
                <td>
                  <span className={`ui-pill ${ROLES[user.role].className}`}>{ROLES[user.role].label}</span>
                </td>
                <td className="is-number">{user.role === 'STUDENT' ? user.played : '—'}</td>
                <td className="admin-table__muted">{user.activated ? formatAgo(user.lastActiveAt) : 'uitgenodigd'}</td>
                <td className="is-actions">
                  <span className="admin-table__actions">
                    <button type="button" className="ui-icon-btn" aria-label={`Bewerk ${user.username}`} onClick={() => setEditing(user)}>
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h4L19 9l-4-4L4 16z" />
                        <path d="M13 7l4 4" />
                      </svg>
                    </button>
                    <button type="button" className="ui-icon-btn ui-icon-btn--danger" aria-label={`Verwijder ${user.username}`} onClick={() => setDeleting(user)}>
                      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                      </svg>
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.users.length === 0 && <p className="admin-page__empty">Geen gebruikers gevonden.</p>}
      </div>

      {data && (
        <div className="admin-pager">
          <span>
            {data.users.length} van {data.total} getoond · pagina {data.page} van {pages}
          </span>
          <span className="admin-pager__buttons">
            <button type="button" className="ui-btn ui-btn--small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Vorige
            </button>
            <button type="button" className="ui-btn ui-btn--small" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Volgende
            </button>
          </span>
        </div>
      )}

      {adding && (
        <AddTeacherModal
          onClose={() => setAdding(false)}
          onAdded={() => {
            load()
          }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(text) => {
            setEditing(null)
            message.success(text)
            load()
          }}
        />
      )}
      <Modal
        open={Boolean(deleting)}
        title={`${deleting?.username ?? ''} verwijderen?`}
        onCancel={() => setDeleting(null)}
        onOk={remove}
        okText="Ja, verwijderen"
        cancelText="Annuleren"
        okButtonProps={{ danger: true }}
      >
        <p>
          Het account van {deleting?.username} ({deleting?.email}) wordt gewist. Dit kun je niet ongedaan maken. Oude eindstanden
          blijven kloppen: daar staat dan &quot;Verwijderde speler&quot;.
        </p>
      </Modal>
    </AdminLayout>
  )
}

/** Story 11: docent toevoegen. Daarna zie je de uitnodigingslink, voor het geval de mail niet aankomt. */
function AddTeacherModal({ onClose, onAdded }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState(null)
  const [copied, setCopied] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const data = await api('/admin/users', { method: 'POST', body: { username, email } })
      setInvite(data)
      onAdded()
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(invite.inviteLink)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal open title="Docent toevoegen" onCancel={onClose} footer={null} destroyOnHidden>
      {invite ? (
        <div className="ui-form">
          <Notice type="success">{invite.user.username} is toegevoegd als docent.</Notice>
          <p>
            We hebben een mail gestuurd met een link om een wachtwoord te kiezen. Komt die niet aan? Stuur dan deze link door
            (7 dagen geldig, werkt één keer):
          </p>
          <TextField label="Uitnodigingslink" readOnly value={invite.inviteLink} onFocus={(e) => e.target.select()} />
          <div className="ui-actions">
            <button type="button" className="ui-btn" onClick={copy}>
              {copied ? 'Gekopieerd!' : 'Kopieer link'}
            </button>
            <button type="button" className="ui-btn ui-btn--primary" onClick={onClose}>
              Klaar
            </button>
          </div>
        </div>
      ) : (
        <form className="ui-form" onSubmit={submit} noValidate>
          <TextField label="Naam" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} hint="2 tot 20 tekens." />
          <TextField label="E-mailadres" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Notice>{error}</Notice>
          <div className="ui-actions">
            <button type="button" className="ui-btn" onClick={onClose}>
              Annuleren
            </button>
            <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
              {busy ? 'Toevoegen…' : 'Docent toevoegen'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

/** Story 11 en 12: naam, e-mailadres en rol van een gebruiker aanpassen. */
function EditUserModal({ user, onClose, onSaved }) {
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState(user.role)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (username !== user.username || email !== user.email) {
        await api(`/admin/users/${user.id}`, { method: 'PATCH', body: { username, email } })
      }
      if (role !== user.role) {
        await api(`/admin/users/${user.id}/role`, { method: 'PATCH', body: { role } })
      }
      onSaved(`${username} is bijgewerkt.`)
    } catch (apiError) {
      setError(apiError.message)
      setBusy(false)
    }
  }

  return (
    <Modal open title={`${user.username} bewerken`} onCancel={onClose} footer={null} destroyOnHidden>
      <form className="ui-form" onSubmit={submit} noValidate>
        <TextField label="Naam" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField label="E-mailadres" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="ui-field">
          <span className="ui-label">Rol</span>
          <select className="ui-select" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {role !== user.role && <p className="ui-hint">Na een rolwijziging moet {user.username} opnieuw inloggen.</p>}
        <Notice>{error}</Notice>
        <div className="ui-actions">
          <button type="button" className="ui-btn" onClick={onClose}>
            Annuleren
          </button>
          <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
            {busy ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
