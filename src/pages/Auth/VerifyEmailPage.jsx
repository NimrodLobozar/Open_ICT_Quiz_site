import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/http.js'
import { TextField, Notice } from '../../components/AccountUi.jsx'
import PageRings from '../../components/PageRings.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import ResendVerification from './ResendVerification.jsx'
import './AuthPage.css'

// Eén verzoek per link. React draait useEffect in development twee keer (StrictMode); zonder dit
// zou het tweede verzoek "link al gebruikt" krijgen en zag je een foutmelding terwijl het gelukt is.
const requests = new Map()
function verifyOnce(token) {
  if (!requests.has(token)) requests.set(token, api('/auth/verify-email', { method: 'POST', body: { token } }))
  return requests.get(token)
}

/**
 * /email-bevestigen?token=... (story 14): de link uit de bevestigingsmail.
 * Gelukt → door naar /inloggen (met een melding dat het gelukt is). Verlopen → een nieuwe mail aanvragen.
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    verifyOnce(token)
      .then(() => !cancelled && navigate('/inloggen?bevestigd=1', { replace: true }))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [token, navigate])

  return (
    <div className="page auth-page">
      <PageRings />
      <QuizHeader />
      <main className="page__main auth-page__main">
        <div className="auth-page__card ui-card">
          {!failed ? (
            <p role="status">E-mailadres bevestigen…</p>
          ) : (
            <div className="ui-form">
              <h1 className="ui-title">LINK WERKT NIET</h1>
              <Notice>Deze link is verlopen of al gebruikt.</Notice>
              <p className="auth-page__switch">
                Heb je al op de link geklikt? Dan kun je gewoon <Link to="/inloggen" className="ui-link">inloggen</Link>. Anders
                vul je hieronder je e-mailadres in voor een nieuwe bevestigingsmail.
              </p>
              <TextField label="E-mailadres" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <ResendVerification email={email} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
