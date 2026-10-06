import { App, Button, Card, Form, InputNumber, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/http.js'

// Instellingen voordat de lobby opent (projectplan 3.1 stap 3).
// Bij "Lobby openen" maakt de server de game aan en zet de cookie quiz_host.
// TODO(team, Fase 1–2 afmaken): standaardwaarden afstemmen met het team (Open punten 1 en 6),
// uitleg/tooltip per instelling, quizdetails tonen (aantal vragen, rol).
export default function HostSetupPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [quiz, setQuiz] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api(`/quizzes/${quizId}`)
      .then(setQuiz)
      .catch((error) => message.error(error.message))
  }, [quizId, message])

  async function openLobby(settings) {
    setCreating(true)
    try {
      const { gameCode } = await api('/games', {
        method: 'POST',
        body: { quizId: Number(quizId), settings },
      })
      navigate(`/host/${gameCode}`)
    } catch (error) {
      message.error(error.message)
      setCreating(false)
    }
  }

  if (!quiz) return <Spin size="large" style={{ display: 'block', margin: 40 }} />

  return (
    <Card style={{ maxWidth: 520, margin: '0 auto' }}>
      <Typography.Title level={3}>{quiz.title}</Typography.Title>
      <Typography.Paragraph type="secondary">{quiz.questions.length} vragen</Typography.Paragraph>

      <Form
        layout="vertical"
        initialValues={{ maxPlayers: 100, timePerQuestion: 20, questionPreviewSeconds: 0 }}
        onFinish={openLobby}
      >
        <Form.Item label="Max. aantal spelers" name="maxPlayers">
          <InputNumber min={1} max={500} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Tijd per vraag (seconden)" name="timePerQuestion">
          <InputNumber min={5} max={120} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Leestijd vóór de antwoorden (seconden, 0 = direct antwoorden)"
          name="questionPreviewSeconds"
        >
          <InputNumber min={0} max={30} style={{ width: '100%' }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={creating}>
          Lobby openen
        </Button>
      </Form>
    </Card>
  )
}
