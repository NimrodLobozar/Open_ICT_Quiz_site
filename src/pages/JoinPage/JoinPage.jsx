import { Alert, Button, Card, Form, Input, Slider, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/http.js'
import './JoinPage.css'

const skillDefinitions = [
  { label: 'SD', color: '#f59e0b' },
  { label: 'AI', color: '#14b8a6' },
  { label: 'TI', color: '#facc15' },
  { label: 'CSC', color: '#6366f1' },
  { label: 'GD', color: '#22c55e' },
  { label: 'BI', color: '#3b82f6' },
]

// TODO(team): quiztitel van de server halen zodra games aan een echte quiz hangen.
const QUIZ_TITLE = 'Open ICT Quiz'

export default function JoinPage() {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [locationNotice, setLocationNotice] = useState('')
  const [isNoticeClosing, setIsNoticeClosing] = useState(false)
  const [game, setGame] = useState(null)
  const isInvalidCode = code && !/^\d{6}$/.test(code)
  const [codeStatus, setCodeStatus] = useState(code ? 'checking' : 'idle')

  useEffect(() => {
    if (isInvalidCode) {
      navigate('/join', {
        replace: true,
        state: { locationNotice: 'Ongeldige code. Voer een 6-cijferige code in.' },
      })
      return
    }

    if (!code) {
      setCodeStatus('idle')
      return
    }

    // Voorkomt dat een oud antwoord nog iets doet als de code intussen veranderd is.
    let cancelled = false

    // Games leven in het geheugen van de server (aangemaakt door de host), dus we vragen het daar na.
    async function checkCode() {
      try {
        const data = await api(`/games/${code}`)
        if (cancelled) return
        setGame(data)
        setCodeStatus('valid')
      } catch (error) {
        if (cancelled) return
        navigate('/join', {
          replace: true,
          state: {
            locationNotice: error.status === 404
              ? 'Ongeldige code. Voer een 6-cijferige code in.'
              : 'De quizcode kon niet worden gecontroleerd.',
          },
        })
      }
    }

    checkCode()

    return () => {
      cancelled = true
    }
  }, [code, isInvalidCode, navigate])

  useEffect(() => {
    const notice = location.state?.locationNotice

    if (!notice) return

    setLocationNotice(notice)
    setIsNoticeClosing(false)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state?.locationNotice, navigate])

  useEffect(() => {
    if (!locationNotice) return

    const closeTimeout = setTimeout(() => {
      setIsNoticeClosing(true)
    }, 5000)
    const removeTimeout = setTimeout(() => {
      setLocationNotice('')
    }, 5300)

    return () => {
      clearTimeout(closeTimeout)
      clearTimeout(removeTimeout)
    }
  }, [locationNotice])

  return (
    <div className="join-page">
      <header className="join-nav">
        <span className="join-brand">OPEN ICT QUIZ</span>
        <a className="join-login-button" href="/login">
          <svg className="join-login-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="5" r="2.5" />
            <path d="M3.5 14c.4-2.4 2-3.6 4.5-3.6s4.1 1.2 4.5 3.6" />
          </svg>
          Inloggen
        </a>
      </header>
      {locationNotice && (
        <Alert
          className={`join-notice ${isNoticeClosing ? 'join-notice-closing' : ''}`}
          type="error"
          showIcon
          message="Ongeldige quizcode"
          description={locationNotice}
        />
      )}
      {code && !isInvalidCode && codeStatus === 'valid' && game ? (
        <NicknameStep key={code} code={code} locked={game.locked} />
      ) : <CodeStep />}
    </div>
  )
}

function CodeStep() {
  const [login, setLogin] = useState(false)

  return (
    <div className="code-panel">
      <div className="code-options" role="tablist" aria-label="Kies hoe je wilt meedoen">
        <button
          className={`code-option ${!login ? 'code-option-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={!login}
          onClick={() => setLogin(false)}
        >
          Meedoen met code
        </button>
        <button
          className={`code-option ${login ? 'code-option-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={login}
          onClick={() => setLogin(true)}
        >
          Login
        </button>
      </div>
      <Card className="code-card">
        {login ? (
          <LoginForm />
        ) : (
          <CodeForm />
        )}
      </Card>
    </div>
  )
}

function LoginForm() {
  return (
    <>
    </>
  )
}

function CodeForm() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  // Eerst vragen of de game bestaat, zodat je bij een typfout meteen een melding krijgt.
  async function checkCode({ code }) {
    setError(null)
    try {
      await api(`/games/${code}`)
      navigate(`/join/${code}`)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  return (
    <>
      <header className="code-header">
        <Typography.Title className="code-title" level={3}>Voer de code in</Typography.Title>
      </header>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form className="code-form" layout="vertical" onFinish={checkCode}>
        <Form.Item
          label="Code"
          name="code"
          rules={[{ required: true, pattern: /^\d{6}$/, message: 'Vul de 6 cijfers in.' }]}
          normalize={(value) => value.replace(/\D/g, '').slice(0, 6)}
        >
          <Input
            size="large"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            placeholder="123456"
            style={{ fontSize: 28, letterSpacing: 6, textAlign: 'center' }}
          />
        </Form.Item>
        <Button className="code-button" type="primary" htmlType="submit" size="large" block>
          Verder
        </Button>
      </Form>
    </>
  )
}

function SkillSlider({ label, color, value, onChange }) {
  return (
    <div className="skill-slider">
      <span className="skill-label">
        <span className="skill-dot" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </span>
      <Slider value={value} onChange={onChange} min={0} max={5} style={{ flex: 1 }} />
      <strong>{value}</strong>
    </div>
  )
}

function NicknameStep({ code, locked }) {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [skillValues, setSkillValues] = useState(
    () => Object.fromEntries(skillDefinitions.map(({ label }) => [label, 5])),
  )

  // Rejoin: heeft deze browser al een speler-cookie voor deze game, dan meteen door naar het spel.
  useEffect(() => {
    api(`/games/${code}/me`)
      .then(() => navigate(`/play/${code}`, { replace: true }))
      .catch(() => {}) // geen sessie: gewoon het formulier tonen
  }, [code, navigate])

  // De server checkt de naam en zet de cookie. Daarna weet /play/:code wie we zijn.
  // TODO(team): skills gaan al mee, maar de server slaat ze nog niet op.
  async function join({ nickname }) {
    setError(null)
    setSending(true)
    try {
      await api(`/games/${code}/players`, { method: 'POST', body: { nickname, skills: skillValues } })
      navigate(`/play/${code}`)
    } catch (apiError) {
      setError(apiError.message)
      setSending(false)
    }
  }

  return (
    <>
      <Card className="join-card">
        <header className="join-header">
          <Typography.Text type="secondary" className="join-header-text">
            {QUIZ_TITLE}
          </Typography.Text>
          <Typography.Text type="secondary" className="join-header-text">
            {code}
          </Typography.Text>
        </header>
        <div className="join-title">
          <Typography.Text type="secondary" className="join-title-text">
            Je bent er bijna!
          </Typography.Text>
          <Typography.Title className="join-title-title">
            Vul je gegevens in
          </Typography.Title>
        </div>
        {locked && (
          <Alert type="warning" showIcon message="Deze lobby is gesloten." style={{ marginBottom: 16 }} />
        )}
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={join}>
          <Form.Item
            label="Gebruikersnaam:"
            name="nickname"
            rules={[{ required: true, min: 2, max: 20, whitespace: true, message: '2 tot 20 tekens.' }]}
            style={{ marginBottom: '2vh' }}
          >
            <Input placeholder="Vul hier in..." size="large" maxLength={20} autoComplete="off" autoFocus />
          </Form.Item>
          <Form.Item label="Vul hier jouw vaardigheden in: (0-5)" required style={{ marginBottom: '2.5vh' }}>
            <div className="skills-list">
              {skillDefinitions.map((skill) => (
                <SkillSlider
                  key={skill.label}
                  {...skill}
                  value={skillValues[skill.label]}
                  onChange={(value) => setSkillValues((current) => ({ ...current, [skill.label]: value }))}
                />
              ))}
            </div>
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={sending}>
            Join
          </Button>
          <a href="/login" className="login-link">
            Gegevens bewaren? Log in om je voortgang te bewaren.
          </a>
        </Form>
      </Card>
    </>
  )
}
