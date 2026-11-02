import { Modal } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/http.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Notice, PasswordField, TextField } from '../../components/AccountUi.jsx'
import { DELETE_CONFIRM_WORD, isDeleteConfirmed } from '../../utils/confirmDelete.js'

/**
 * Blok "Account verwijderen" op Instellingen (story 6).
 * Twee drempels tegen per ongeluk verwijderen: het woord VERWIJDER typen én je wachtwoord.
 */
export default function DeleteAccount() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // De knop werkt pas als het woord klopt én er een wachtwoord is ingevuld.
  const canDelete = isDeleteConfirmed(typed) && password.length > 0

  function close() {
    setOpen(false)
    setTyped('')
    setPassword('')
    setError(null)
  }

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await api('/me', { method: 'DELETE', body: { password } })
      setUser(null)
      navigate('/', { replace: true })
    } catch (apiError) {
      setError(apiError.message)
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="delete-title" className="ui-card settings-page__danger">
      <h2 id="delete-title" className="ui-section-title">
        Account verwijderen
      </h2>
      <p>Je profiel en al je bewaarde scores worden gewist. Dit kun je niet ongedaan maken.</p>
      <button type="button" className="ui-btn ui-btn--danger" onClick={() => setOpen(true)}>
        Verwijderen
      </button>

      <Modal open={open} onCancel={close} footer={null} title="Account echt verwijderen?" destroyOnHidden>
        <form
          className="ui-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (canDelete) remove()
          }}
        >
          <p>
            Je profiel, je vaardigheden en je uitslagen worden gewist. In oude eindstanden van anderen staat daarna
            &quot;Verwijderde speler&quot;, zodat hun plaatsen blijven kloppen.
          </p>
          <TextField
            label={`Typ ${DELETE_CONFIRM_WORD} om te bevestigen`}
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <PasswordField label="Je wachtwoord" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Notice>{error}</Notice>
          <div className="ui-actions">
            <button type="button" className="ui-btn" onClick={close}>
              Annuleren
            </button>
            <button type="submit" className="ui-btn ui-btn--danger" disabled={!canDelete || busy}>
              {busy ? 'Verwijderen…' : 'Ja, verwijder mijn account'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
