import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/http.js'
import { Notice, TextField } from '../../components/AccountUi.jsx'
import { HU_EMAIL_MESSAGE, isResetEmailAllowed } from '../../utils/schoolEmail.js'
import PageRings from '../../components/PageRings.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import { ResendButton } from './ResendVerification.jsx'
import './AuthPage.css'

/**
 * /wachtwoord-vergeten (story 3). Na het versturen zie je altijd dezelfde tekst,
 * of het e-mailadres nu bestaat of niet: zo kan niemand uitzoeken wie er een account heeft.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const sendLink = () => api('/auth/forgot', { method: 'POST', body: { email } })

  async function submit(event) {
    event.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Vul een geldig e-mailadres in.')
      return
    }
    // Zelfde regel als de server (gedeeld bestand): alleen je HU-adres.
    if (!isResetEmailAllowed(email)) {
      setError(HU_EMAIL_MESSAGE)
      return
    }
    setBusy(true)
    try {
      await sendLink()
      setSent(true)
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page auth-page">
      <PageRings />
      <QuizHeader />
      <main className="page__main auth-page__main">
        <div className="auth-page__card ui-card">
          {sent ? (
            <div className="ui-form">
              <h1 className="ui-title">KIJK IN JE MAIL</h1>
              <Notice type="success">
                Als er een account bij dit e-mailadres hoort, krijg je binnen een paar minuten een mail met een link.
              </Notice>
              <p className="auth-page__switch">
                De link is een uur geldig. Vraag je een nieuwe aan, dan werkt de vorige ook nog; zodra je er één
                gebruikt, vervallen de andere.
              </p>
              {/* Meteen wachten: de eerste mail is net verstuurd. */}
              <ResendButton send={sendLink} startWaiting />
              <Link to="/inloggen" className="ui-btn ui-btn--block">
                Terug naar inloggen
              </Link>
            </div>
          ) : (
            <form className="ui-form" onSubmit={submit} noValidate>
              <div>
                <p className="auth-page__welcome">Geen probleem.</p>
                <h1 className="ui-title">WACHTWOORD VERGETEN</h1>
              </div>
              <p className="auth-page__welcome">Vul je HU-mailadres in. Je krijgt een link om een nieuw wachtwoord te kiezen.</p>
              <TextField label="E-mailadres" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Notice>{error}</Notice>
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--block" disabled={busy}>
                {busy ? 'Versturen…' : 'Stuur mij een link'}
              </button>
              <p className="auth-page__switch">
                Weet je het weer? <Link to="/inloggen" className="ui-link">Inloggen</Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
