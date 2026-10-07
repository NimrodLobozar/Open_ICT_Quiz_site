import { Alert, Button, Card, Form, Input, Slider, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const locationNotice = null

  return (
    <div className="join-page">
      <Card className="join-card">
        {locationNotice && <Alert type="info" showIcon message={locationNotice} style={{ marginBottom: 16 }} />}
        {code ? <NicknameStep key={code} code={code} /> : <CodeStep />}
      </Card>
    </div>
  )
}

function CodeStep() {
  const navigate = useNavigate()

  return (
    <>
      <Typography.Title level={3}>Meedoen</Typography.Title>
      <Form layout="vertical" onFinish={({ code }) => navigate(`/join/${code}`)}>
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
        <Button type="primary" htmlType="submit" size="large" block>
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
        <Typography.Title level={3} className="join-title-title">
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
        <Form.Item label="Vul hier jouw vaardigheden in:" required style={{ marginBottom: '2.5vh' }}>
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
    </>
  )
}
