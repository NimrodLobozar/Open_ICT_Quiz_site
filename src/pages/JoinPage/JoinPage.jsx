import { Alert, Button, Card, Form, Input, Slider, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/http.js'
import './JoinPage.css'

const skills = [
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
  const locationNotice = null

  return (
    <div className="join-page">
      {locationNotice && <Alert type="info" showIcon message={locationNotice} style={{ marginBottom: 16 }} />}
      {code ? <NicknameStep key={code} code={code} /> : <CodeStep />}
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
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Rejoin: heeft deze browser al een speler-cookie voor deze game, dan meteen door naar het spel.
  useEffect(() => {
    api(`/games/${code}/me`)
      .then(() => navigate(`/play/${code}`, { replace: true }))
      .catch(() => {}) // geen sessie: gewoon het formulier tonen
  }, [code, navigate])

  // De server checkt de naam en zet de cookie. Daarna weet /play/:code wie we zijn.
  async function join({ nickname }) {
    setError(null)
    setSending(true)
    try {
      await api(`/games/${code}/players`, { method: 'POST', body: { nickname } })
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
          <Typography.Title level={3} className="join-title-title">
            Vul je gegevens in
          </Typography.Title>
        </div>
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
          <Form.Item label="Vul hier jouw vaardigheden in:" required style={{ marginBottom: '2.5vh' }}>
            <div className="skills-list">
              {skills.map((skill) => <SkillSlider key={skill.label} {...skill} />)}
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
