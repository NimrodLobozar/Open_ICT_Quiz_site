import { Alert, Button, Card, Form, Input, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/http.js'
import { useGameSession } from '../hooks/useGameSession.js'

// Meedoen met een game (projectplan 3.2 stap 1–2).
//
// Stap 1 (/join):        code van 6 cijfers invullen → door naar /join/:code
// Stap 2 (/join/:code):  - heb je al een geldige cookie voor deze game? → meteen naar /play/:code (rejoin)
//                        - anders: naam invullen → POST /api/games/:code/players → /play/:code
// QR-code scannen komt direct bij stap 2 uit.
export default function JoinPage() {
  const { code } = useParams()
  const location = useLocation()
  const notice = location.state?.notice // bijv. "De host heeft de game afgesloten."

  return (
    <Card style={{ maxWidth: 420, margin: '0 auto' }}>
      {notice && <Alert type="info" showIcon title={notice} style={{ marginBottom: 16 }} />}
      {code ? <NicknameStep key={code} code={code} /> : <CodeStep />}
    </Card>
  )
}

function CodeStep({ error }) {
  const navigate = useNavigate()

  return (
    <>
      <Typography.Title level={3}>Meedoen</Typography.Title>
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={({ code }) => navigate(`/join/${code}`)}>
        <Form.Item
          label="Code"
          name="code"
          rules={[{ required: true, pattern: /^\d{6}$/, message: 'Vul de 6 cijfers in.' }]}
          // Alleen cijfers overhouden, ook als iemand iets anders plakt.
          normalize={(value) => value.replace(/\D/g, '').slice(0, 6)}
        >
          <Input
            size="large"
            inputMode="numeric" // telefoon toont het cijfertoetsenbord
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

function NicknameStep({ code }) {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const session = useGameSession(code, 'player')
  const [game, setGame] = useState(null) // { exists, locked, phase, quizTitle }
  const [gameError, setGameError] = useState(null)
  const [joinError, setJoinError] = useState(null)
  const [joining, setJoining] = useState(false)

  // Rejoin: geldige cookie voor deze game → meteen door.
  useEffect(() => {
    if (session.status === 'ok') navigate(`/play/${code}`, { replace: true })
  }, [session.status, code, navigate])

  useEffect(() => {
    api(`/games/${code}`)
      .then(setGame)
      .catch((error) => setGameError(error.message))
  }, [code])

  async function join({ nickname }) {
    setJoining(true)
    setJoinError(null)
    try {
      await api(`/games/${code}/players`, { method: 'POST', body: { nickname } })
      navigate(`/play/${code}`)
    } catch (error) {
      if (error.error === 'NAME_TAKEN' || error.error === 'NAME_INVALID') {
        form.setFields([{ name: 'nickname', errors: [error.message] }])
      } else {
        setJoinError(error.message)
      }
      setJoining(false)
    }
  }

  if (gameError) return <CodeStep error={gameError} />
  if (!game || session.status === 'loading' || session.status === 'ok') {
    return <Spin size="large" style={{ display: 'block', margin: 40 }} />
  }

  return (
    <>
      <Typography.Text type="secondary">Game {code}</Typography.Text>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {game.quizTitle}
      </Typography.Title>
      {game.locked && (
        <Alert
          type="warning"
          showIcon
          title="Deze lobby is gesloten."
          style={{ marginBottom: 16 }}
        />
      )}
      {joinError && <Alert type="error" showIcon title={joinError} style={{ marginBottom: 16 }} />}

      {/* TODO(team, L1): ingelogd? Dan geen naam vragen maar meteen joinen met je accountnaam. */}
      <Form form={form} layout="vertical" onFinish={join}>
        <Form.Item
          label="Jouw naam"
          name="nickname"
          rules={[
            { required: true, min: 2, max: 20, whitespace: true, message: '2 tot 20 tekens.' },
          ]}
        >
          <Input size="large" maxLength={20} autoComplete="off" autoFocus />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={joining}>
          Join
        </Button>
      </Form>
    </>
  )
}
