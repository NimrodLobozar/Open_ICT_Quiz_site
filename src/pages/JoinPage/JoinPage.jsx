import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/http.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Notice, SkillSliders, TextField } from '../../components/AccountUi.jsx'
import PageRings from '../../components/PageRings.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import { joinStartSkills } from '../../utils/skills.js'
import { LoginForm } from '../Auth/AuthPage.jsx'
import '../Auth/AuthPage.css'
import './JoinPage.css'

// Als de game geen quiz uit de database heeft (oude games), tonen we deze titel.
const DEFAULT_QUIZ_TITLE = 'Open ICT Quiz'
const INVALID_CODE = 'Deze code bestaat niet. Controleer de 6 cijfers op het grote scherm.'

/**
 * /join en /join/:code. Zelfde stijl als /inloggen (AuthPage.css): cirkels op de achtergrond,
 * wisselknop bovenaan en één kaart in het midden.
 * Stap 1: code invullen (of eerst inloggen). Stap 2 (/join/:code): naam en vaardigheden.
 */
export default function JoinPage() {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  // Melding na een foute code in de link (bijv. /join/999999). Staat boven het codeveld.
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    setGame(null)
    if (!code) return
    if (!/^\d{6}$/.test(code)) {
      navigate('/join', { replace: true, state: { notice: INVALID_CODE } })
      return
    }

    // Voorkomt dat een oud antwoord nog iets doet als de code intussen veranderd is.
    let cancelled = false
    // Games leven in het geheugen van de server (aangemaakt door de host), dus we vragen het daar na.
    api(`/games/${code}`)
      .then((data) => !cancelled && setGame(data))
      .catch((error) => {
        if (cancelled) return
        navigate('/join', {
          replace: true,
          state: { notice: error.status === 404 ? INVALID_CODE : 'De code kon niet worden gecontroleerd. Probeer het opnieuw.' },
        })
      })
    return () => {
      cancelled = true
    }
  }, [code, navigate])

  // De melding uit de navigatie overnemen en meteen uit de geschiedenis halen,
  // anders staat hij er na een refresh nog steeds.
  useEffect(() => {
    if (!location.state?.notice) return
    setNotice(location.state.notice)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.notice, navigate])

  return (
    <div className="page auth-page join-page">
      <PageRings />
      <QuizHeader />
      <main className="page__main auth-page__main">
        {code && game ? (
          <NicknameStep key={code} code={code} locked={game.locked} quizTitle={game.quizTitle ?? DEFAULT_QUIZ_TITLE} />
        ) : code ? (
          <p className="auth-page__note" role="status">Code controleren…</p>
        ) : (
          <CodeStep notice={notice} onClearNotice={() => setNotice(null)} />
        )}
      </main>
    </div>
  )
}

/**
 * Stap 1. Niet ingelogd: wisselknop "Meedoen met code" / "Inloggen".
 * Ingelogd: geen wisselknop meer nodig, alleen het codeveld.
 */
function CodeStep({ notice, onClearNotice }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('code')
  // Na het inloggen op de tab "Inloggen" is user gevuld: dan verdwijnen de tabs en zie je meteen het codeveld.
  const showLogin = !user && tab === 'login'

  return (
    <>
      {!user && (
        <div className="auth-page__tabs" role="group" aria-label="Kies hoe je wilt meedoen">
          <button type="button" className={!showLogin ? 'is-active' : ''} aria-pressed={!showLogin} onClick={() => setTab('code')}>
            Meedoen met code
          </button>
          <button type="button" className={showLogin ? 'is-active' : ''} aria-pressed={showLogin} onClick={() => setTab('login')}>
            Inloggen
          </button>
        </div>
      )}
      <div className="auth-page__card ui-card">
        {/* onSuccess: na het inloggen hier blijven (niet naar Mijn account), zodat je de code kunt invullen. */}
        {showLogin ? <LoginForm onSuccess={() => {}} /> : <CodeForm notice={notice} onClearNotice={onClearNotice} />}
      </div>
      {!user && (
        <p className="auth-page__note">
          {showLogin ? 'Ingelogd komt je uitslag op Mijn account.' : 'Je hebt geen account nodig om mee te doen.'}
        </p>
      )}
    </>
  )
}

function CodeForm({ notice, onClearNotice }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // Eerst vragen of de game bestaat, zodat je bij een typfout meteen een melding krijgt.
  async function submit(event) {
    event.preventDefault()
    onClearNotice()
    if (!/^\d{6}$/.test(code)) {
      setError('Vul de 6 cijfers van de code in.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await api(`/games/${code}`)
      navigate(`/join/${code}`)
    } catch (apiError) {
      setError(apiError.status === 404 ? INVALID_CODE : apiError.message)
      setBusy(false)
    }
  }

  return (
    <form className="ui-form" onSubmit={submit} noValidate>
      <div>
        <p className="auth-page__welcome">{user ? `Hoi ${user.username}!` : 'Klaar voor de quiz?'}</p>
        <h1 className="ui-title">MEEDOEN</h1>
      </div>
      <TextField
        label="Quizcode"
        hint="De 6 cijfers op het grote scherm."
        className="join-page__code"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        placeholder="123456"
        autoFocus
        value={code}
        // Alleen cijfers: plakken van "123 456" werkt dan ook.
        onChange={(event) => {
          setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          setError(null)
          onClearNotice()
        }}
        error={error ?? notice}
      />
      <button type="submit" className="ui-btn ui-btn--primary ui-btn--block" disabled={busy}>
        {busy ? 'Controleren…' : 'Verder'}
      </button>
      {user && (
        <p className="auth-page__switch">
          Je doet mee als <strong>{user.username}</strong>. Je uitslag komt op{' '}
          <Link to="/account" className="ui-link">Mijn account</Link>.
        </p>
      )}
    </form>
  )
}

/** Stap 2: naam (alleen voor gasten) en vaardigheden. */
function NicknameStep({ code, locked, quizTitle }) {
  const navigate = useNavigate()
  // Ingelogd? Dan speel je onder je accountnaam (de server gebruikt die ook) en komt je uitslag op Mijn account.
  const { user } = useAuth()
  const [nickname, setNickname] = useState('')
  const [nameError, setNameError] = useState(null)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  // Met een account beginnen de sliders bij je opgeslagen vaardigheden.
  const [skills, setSkills] = useState(() => joinStartSkills(user))

  // Het account komt soms pas binnen ná de eerste render (useAuth vraagt /auth/me op).
  // Dan de sliders alsnog op je accountwaarden zetten, anders bleven ze op de gast-waarde staan.
  const userId = user?.id
  useEffect(() => {
    if (userId) setSkills(joinStartSkills(user))
    // Alleen opnieuw als er een ánder account inlogt, niet bij elke render (dan zou schuiven niet werken).
  }, [userId])

  // Rejoin: heeft deze browser al een speler-cookie voor deze game, dan meteen door naar het spel.
  useEffect(() => {
    api(`/games/${code}/me`)
      .then(() => navigate(`/play/${code}`, { replace: true }))
      .catch(() => {}) // geen sessie: gewoon het formulier tonen
  }, [code, navigate])

  // De server checkt de naam en zet de cookie. Daarna weet /play/:code wie we zijn.
  // De skills bewaart de server bij de speler; ze komen in de database bij de eindstand (GameResult).
  async function join(event) {
    event.preventDefault()
    setError(null)
    const name = nickname.trim()
    if (!user && (name.length < 2 || name.length > 20)) {
      setNameError('Kies een naam van 2 tot 20 tekens.')
      return
    }
    setNameError(null)
    setSending(true)
    try {
      await api(`/games/${code}/players`, { method: 'POST', body: { nickname: name, skills } })
      navigate(`/play/${code}`)
    } catch (apiError) {
      setError(apiError.message)
      setSending(false)
    }
  }

  return (
    <div className="auth-page__card ui-card">
      <form className="ui-form" onSubmit={join} noValidate>
        <div className="join-page__meta">
          <span>{quizTitle}</span>
          <span>Code {code}</span>
        </div>
        <div>
          <p className="auth-page__welcome">Je bent er bijna!</p>
          <h1 className="ui-title">JOUW GEGEVENS</h1>
        </div>
        {locked && <Notice>Deze lobby is gesloten: er kunnen geen nieuwe spelers meer bij.</Notice>}
        {user ? (
          <p className="join-page__as">
            Je doet mee als <strong>{user.username}</strong>. Je uitslag wordt bewaard op je account.
          </p>
        ) : (
          <TextField
            label="Gebruikersnaam"
            hint="2 tot 20 tekens. Deze naam zie je op het grote scherm."
            maxLength={20}
            autoComplete="off"
            autoFocus
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            error={nameError}
          />
        )}
        <fieldset className="ui-fieldset">
          <legend className="ui-label">Jouw vaardigheden (0–5)</legend>
          <SkillSliders value={skills} onChange={setSkills} />
        </fieldset>
        <Notice>{error}</Notice>
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--block" disabled={sending}>
          {sending ? 'Bezig met meedoen…' : 'Meedoen'}
        </button>
        {!user && (
          <p className="auth-page__switch">
            Scores bewaren?{' '}
            <Link to={`/inloggen?terug=${encodeURIComponent(`/join/${code}`)}`} className="ui-link">
              Log in
            </Link>{' '}
            voordat je meedoet.
          </p>
        )}
      </form>
    </div>
  )
}
