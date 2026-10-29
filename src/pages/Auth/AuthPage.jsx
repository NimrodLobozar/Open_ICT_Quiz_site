import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { homeFor, safeReturnPath, useAuth } from '../../auth/AuthContext.jsx'
import { Checkbox, Notice, PasswordChecklist, PasswordField, TextField } from '../../components/AccountUi.jsx'
import PageRings from '../../components/PageRings.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import { isStrongPassword } from '../../utils/passwordRules.js'
import { HU_EMAIL_MESSAGE, huEmailTypingError, isHuEmail } from '../../utils/schoolEmail.js'
import ResendVerification from './ResendVerification.jsx'
import './AuthPage.css'

/**
 * /inloggen en /registreren (story 1 en 2): één pagina met de wisselknop Inloggen / Account maken,
 * zoals in het design "1 · Inloggen" en "2 · Account maken". Werkt op desktop en telefoon (CSS).
 * Na het inloggen ga je terug naar ?terug=... of naar je eigen startpagina.
 * @param {{ mode: 'login' | 'register' }} props
 */
export default function AuthPage({ mode }) {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const back = safeReturnPath(params.get('terug'))
  // Al ingelogd? Dan heeft dit scherm geen zin.
  if (user) return <Navigate to={back ?? homeFor(user)} replace />

  const query = back ? `?terug=${encodeURIComponent(back)}` : ''
  return (
    <div className="page auth-page">
      <PageRings />
      <QuizHeader />
      <main className="page__main auth-page__main">
        <div className="auth-page__tabs">
          <Link to={`/inloggen${query}`} className={mode === 'login' ? 'is-active' : ''} aria-current={mode === 'login' ? 'page' : undefined}>
            Inloggen
          </Link>
          <Link to={`/registreren${query}`} className={mode === 'register' ? 'is-active' : ''} aria-current={mode === 'register' ? 'page' : undefined}>
            Account maken
          </Link>
        </div>
        <div className="auth-page__card ui-card">
          {/* ?bevestigd=1 komt van /email-bevestigen, na een geldige link uit de bevestigingsmail. */}
          {mode === 'login' ? <LoginForm back={back} verified={params.get('bevestigd') === '1'} /> : <RegisterForm />}
        </div>
        <p className="auth-page__note">Alleen meedoen aan een quiz? Daar heb je geen account voor nodig.</p>
      </main>
    </div>
  )
}

/**
 * Het inlogformulier. Ook gebruikt op de joinpagina (tab "Login"); daar blijf je na het inloggen staan.
 * @param {{ back?: string | null, onSuccess?: (user) => void, compact?: boolean, verified?: boolean }} props
 */
export function LoginForm({ back = null, onSuccess, compact = false, verified = false }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)
  // Story 14: juist wachtwoord, maar het e-mailadres is nog niet bevestigd.
  const [unverified, setUnverified] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setUnverified(false)
    if (!email.trim() || !password) {
      setError('Vul je e-mailadres en wachtwoord in.')
      return
    }
    setBusy(true)
    try {
      const user = await login({ email, password, remember })
      if (onSuccess) onSuccess(user)
      else navigate(back ?? homeFor(user), { replace: true })
    } catch (apiError) {
      // Bewust één algemene melding (komt van de server): niet verraden of het e-mailadres bestaat.
      setError(apiError.message)
      setUnverified(apiError.code === 'EMAIL_NOT_VERIFIED')
      setBusy(false)
    }
  }

  return (
    <form className="ui-form" onSubmit={submit} noValidate>
      {!compact && (
        <div>
          <p className="auth-page__welcome">Welkom terug!</p>
          <h1 className="ui-title">INLOGGEN</h1>
        </div>
      )}
      {verified && <Notice type="success">Je e-mailadres is bevestigd. Log nu in.</Notice>}
      <TextField label="E-mailadres" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField
        label="Wachtwoord"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        action={
          <Link to="/wachtwoord-vergeten" className="ui-link auth-page__forgot">
            Wachtwoord vergeten?
          </Link>
        }
      />
      <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
        Ingelogd blijven op dit apparaat
      </Checkbox>
      <Notice>{error}</Notice>
      {unverified && <ResendVerification email={email} />}
      <button type="submit" className="ui-btn ui-btn--primary ui-btn--block" disabled={busy}>
        {busy ? 'Bezig met inloggen…' : 'Inloggen'}
      </button>
      {!compact && (
        <p className="auth-page__switch">
          Nog geen account? <Link to="/registreren" className="ui-link">Maak er een</Link>
        </p>
      )}
    </form>
  )
}

// Welke foutcode van de server bij welk veld hoort, zodat de melding naast het juiste veld staat.
const FIELD_FOR_ERROR = {
  USERNAME_INVALID: 'username',
  USERNAME_TAKEN: 'username',
  EMAIL_INVALID: 'email',
  EMAIL_TAKEN: 'email',
  EMAIL_NOT_HU: 'email',
  PASSWORD_WEAK: 'password',
  PRIVACY_REQUIRED: 'privacy',
}

function RegisterForm() {
  const { register } = useAuth()
  const [fields, setFields] = useState({ username: '', email: '', password: '', acceptPrivacy: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  // Na het registreren: het adres waar de bevestigingsmail heen ging (story 14).
  const [sentTo, setSentTo] = useState(null)
  const set = (name) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setFields((current) => ({ ...current, [name]: value }))
  }

  // Eerst zelf controleren, zodat je de fout ziet zonder te wachten. De server controleert daarna nog eens.
  function validate() {
    const found = {}
    const name = fields.username.trim()
    if (name.length < 2 || name.length > 20) found.username = 'Kies een naam van 2 tot 20 tekens.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) found.email = 'Vul een geldig e-mailadres in.'
    else if (!isHuEmail(fields.email)) found.email = HU_EMAIL_MESSAGE
    if (!isStrongPassword(fields.password)) found.password = 'Je wachtwoord voldoet nog niet aan alle eisen.'
    if (!fields.acceptPrivacy) found.privacy = 'Ga akkoord met de privacyregels om een account te maken.'
    return found
  }

  async function submit(event) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const user = await register(fields)
      // Story 14: nog niet ingelogd. Eerst de link in de mail, dan inloggen.
      setSentTo(user.email)
    } catch (apiError) {
      setErrors({ [FIELD_FOR_ERROR[apiError.code] ?? 'general']: apiError.message })
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <div className="ui-form">
        <h1 className="ui-title">CHECK JE MAILBOX</h1>
        <Notice type="success">
          Je account is gemaakt. We hebben een mail gestuurd naar <strong>{sentTo}</strong>.
        </Notice>
        <p className="auth-page__switch">
          Klik op de link in de mail om je e-mailadres te bevestigen (24 uur geldig). Daarna kun je inloggen. Niets ontvangen?
          Kijk ook in je spam.
        </p>
        <ResendVerification email={sentTo} />
        <Link to="/inloggen" className="ui-btn ui-btn--primary ui-btn--block">
          Naar inloggen
        </Link>
      </div>
    )
  }

  // Tijdens het typen al een melding als het geen HU-adres meer kan worden. Een fout na verzenden gaat voor.
  const emailError = errors.email ?? huEmailTypingError(fields.email)
  return (
    <form className="ui-form" onSubmit={submit} noValidate>
      <div>
        <p className="auth-page__welcome">Bewaar je scores en zie hoe je groeit.</p>
        <h1 className="ui-title">ACCOUNT MAKEN</h1>
      </div>
      <TextField
        label="Gebruikersnaam"
        autoComplete="username"
        maxLength={20}
        hint="2 tot 20 tekens. Deze naam zie je op het grote scherm."
        value={fields.username}
        onChange={set('username')}
        error={errors.username}
      />
      <TextField
        label="E-mailadres"
        type="email"
        autoComplete="email"
        hint="Gebruik je HU-mailadres (@student.hu.nl of @hu.nl)."
        value={fields.email}
        onChange={(event) => {
          // Oude foutmelding weg zodra je het adres aanpast; de melding tijdens het typen neemt het over.
          setErrors(({ email: _old, ...rest }) => rest)
          set('email')(event)
        }}
        error={emailError}
      />
      <PasswordField
        label="Wachtwoord"
        autoComplete="new-password"
        value={fields.password}
        onChange={set('password')}
        error={errors.password}
      />
      <PasswordChecklist password={fields.password} />
      <Checkbox checked={fields.acceptPrivacy} onChange={set('acceptPrivacy')} error={errors.privacy}>
        Ik ga akkoord met de <Link to="/privacy" className="ui-link">privacyregels</Link>. Mijn scores worden bewaard.
      </Checkbox>
      <Notice>{errors.general}</Notice>
      <button type="submit" className="ui-btn ui-btn--primary ui-btn--block" disabled={busy}>
        {busy ? 'Account wordt gemaakt…' : 'Account maken'}
      </button>
      <p className="auth-page__switch">Ben je docent? Een beheerder maakt je account aan.</p>
    </form>
  )
}
