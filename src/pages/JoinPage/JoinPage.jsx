import { Alert, Button, Card, Form, Input, Slider, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import './JoinPage.css'

const skills = [
  { label: 'SD', color: '#f59e0b' },
  { label: 'AI', color: '#14b8a6' },
  { label: 'TI', color: '#facc15' },
  { label: 'CSC', color: '#6366f1' },
  { label: 'GD', color: '#22c55e' },
  { label: 'BI', color: '#3b82f6' },
]

const demoGame = {
  quizTitle: 'Open ICT Quiz',
  locked: false,
}

export default function JoinPage() {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [locationNotice, setLocationNotice] = useState('')
  const [isNoticeClosing, setIsNoticeClosing] = useState(false)
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

    const controller = new AbortController()

    async function checkCode() {
      try {
        const response = await fetch(`/api/code/${code}`, { signal: controller.signal })

        if (!response.ok) {
          throw new Error(`Code check failed with status ${response.status}`)
        }

        const data = await response.json()

        if (!data.exists) {
          navigate('/join', {
            replace: true,
            state: { locationNotice: 'Ongeldige code. Voer een 6-cijferige code in.' },
          })
          return
        }

        setCodeStatus('valid')
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error('Error checking quiz code:', error)
        navigate('/join', {
          replace: true,
          state: { locationNotice: 'De quizcode kon niet worden gecontroleerd.' },
        })
      }
    }

    checkCode()

    return () => controller.abort()
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
      {code && !isInvalidCode && codeStatus === 'valid' ? <NicknameStep key={code} code={code} /> : <CodeStep />}
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

  return (
    <>
      <header className="code-header">
        <Typography.Title className="code-title" level={3}>Voer de code in</Typography.Title>
      </header>
      <Form className="code-form" layout="vertical" onFinish={({ code }) => navigate(`/join/${code}`)}>
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

function SkillSlider({ label, color }) {
  const [value, setValue] = useState(5)

  return (
    <div className="skill-slider">
      <span className="skill-label">
        <span className="skill-dot" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </span>
      <Slider value={value} onChange={setValue} min={0} max={5} style={{ flex: 1 }} />
      <strong>{value}</strong>
    </div>
  )
}

function NicknameStep({ code }) {
  const [form] = Form.useForm()
  const [joined, setJoined] = useState(false)

  function join({ nickname }) {
    setJoined(nickname)
  }

  if (joined) {
    return (
      <Alert
        type="success"
        showIcon
        message={`Welkom, ${joined}!`}
        description={`Je bent lokaal toegevoegd aan ${demoGame.quizTitle} (${code}).`}
      />
    )
  }

  return (
    <>
      <Card className="join-card">
        <header className="join-header">
          <Typography.Text type="secondary" className="join-header-text">
            {demoGame.quizTitle}
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
        {demoGame.locked && (
          <Alert type="warning" showIcon message="Deze lobby is gesloten." style={{ marginBottom: 16 }} />
        )}
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
              {skills.map((skill) => <SkillSlider key={skill.label} {...skill} />)}
            </div>
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
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