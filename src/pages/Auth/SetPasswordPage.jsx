import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api/http.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Notice, PasswordChecklist, PasswordField } from '../../components/AccountUi.jsx'
import PageRings from '../../components/PageRings.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import { isStrongPassword } from '../../utils/passwordRules.js'
import './AuthPage.css'

/**
 * /wachtwoord-instellen?token=... Eén pagina voor twee links:
 * - "wachtwoord vergeten" (story 3): nieuw wachtwoord kiezen;
 * - uitnodiging voor een nieuwe docent (story 11): eerste wachtwoord kiezen.
 */
export default function SetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { setUser } = useAuth()
  // checking → form → done, of invalid als de link niet (meer) werkt.
  const [state, setState] = useState('checking')
  const [link, setLink] = useState(null)
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api(`/auth/password-link?token=${encodeURIComponent(token)}`)
      .then((data) => {
        if (cancelled) return
        setLink(data)
        setState('form')
      })
      .catch(() => !cancelled && setState('invalid'))
    return () => {
      cancelled = true
    }
  }, [token])

  async function submit(event) {
    event.preventDefault()
    setError(null)
    if (!isStrongPassword(password)) return setError('Je wachtwoord voldoet nog niet aan alle eisen.')
    if (password !== repeat) return setError('De twee wachtwoorden zijn niet hetzelfde.')
    setBusy(true)
    try {
      await api('/auth/password', { method: 'POST', body: { token, password } })
      // De server logt je overal uit; hier ook, zodat je met het nieuwe wachtwoord inlogt.
      setUser(null)
      setState('done')
    } catch (apiError) {
      if (apiError.code === 'LINK_INVALID') setState('invalid')
      else setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  const invite = link?.purpose === 'INVITE'
  return (
    <div className="page auth-page">
      <PageRings />
      <QuizHeader />
      <main className="page__main auth-page__main">
        <div className="auth-page__card ui-card">
          {state === 'checking' && <p role="status">Link controleren…</p>}

          {state === 'invalid' && (
            <div className="ui-form">
              <h1 className="ui-title">LINK WERKT NIET</h1>
              <Notice>Deze link is verlopen of al gebruikt.</Notice>
              <p className="auth-page__switch">
                Vraag een nieuwe link aan. Ben je docent en werkt je uitnodiging niet meer? Vraag de beheerder om een nieuwe.
              </p>
              <Link to="/wachtwoord-vergeten" className="ui-btn ui-btn--primary ui-btn--block">
                Nieuwe link aanvragen
              </Link>
            </div>
          )}

          {state === 'done' && (
            <div className="ui-form">
              <h1 className="ui-title">GELUKT!</h1>
              <Notice type="success">Je wachtwoord is ingesteld. Log nu in met je nieuwe wachtwoord.</Notice>
              <Link to="/inloggen" className="ui-btn ui-btn--primary ui-btn--block">
                Inloggen
              </Link>
            </div>
          )}

          {state === 'form' && (
            <form className="ui-form" onSubmit={submit} noValidate>
              <div>
                <p className="auth-page__welcome">Hoi {link.username}!</p>
                <h1 className="ui-title">{invite ? 'KIES JE WACHTWOORD' : 'NIEUW WACHTWOORD'}</h1>
              </div>
              {invite && <p className="auth-page__welcome">Je docentaccount staat klaar. Kies een wachtwoord om het te activeren.</p>}
              <PasswordField label="Nieuw wachtwoord" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <PasswordChecklist password={password} />
              <PasswordField label="Herhaal wachtwoord" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
              <Notice>{error}</Notice>
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--block" disabled={busy}>
                {busy ? 'Opslaan…' : 'Wachtwoord opslaan'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
