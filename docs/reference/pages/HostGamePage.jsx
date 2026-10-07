// REFERENTIE — deze versie wordt NIET door de app gebruikt.
// Dit was de skeleton-versie van client/src/pages/HostGamePage.jsx voordat die leeggehaald werd.
// Gebruik dit als voorbeeld/inspiratie; kopieer stukken over naar client/src/pages/HostGamePage.jsx.
// Zie docs/reference/README.md.

import { LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Col, Flex, Result, Row, Spin, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import JoinQrCode from '../components/JoinQrCode.jsx'
import PlayerList from '../components/PlayerList.jsx'
import { useGameSession } from '../hooks/useGameSession.js'
import { useGameSocket } from '../hooks/useGameSocket.js'
import { useSocketEvent } from '../hooks/useSocketEvent.js'
import { GAME_CLOSED, HOST_END, HOST_LOCK, HOST_START, LOBBY_UPDATE } from '../socket/events.js'
import { emitWithAck } from '../socket/socket.js'

// Host-scherm (digibord): lobby → vragen → tussenstand → podium (projectplan 3.1 stap 4–10).
//
// KLAAR: sessie-check (rejoin via cookie quiz_host), joincode + QR, live spelerslijst,
//        lobby op slot/open, afsluiten.
// TODO(team):
// - Fase 3: max. spelers tonen ("12 / 100"), (optioneel) speler kicken.
// - Fase 4: luister naar GAME_PHASE en QUESTION_SHOW / QUESTION_PROGRESS / QUESTION_END en toon
//   per fase een ander scherm (vraag + timer + "x van y heeft geantwoord", daarna het juiste antwoord).
// - Fase 5: LEADERBOARD_SHOW → <Leaderboard />, GAME_PODIUM → <Podium />, knop "Volgende vraag".
// - Fase 6: knoppen "Quiz herstarten" (HOST_RESTART) en "Afsluiten" op het podium.
// Tip: maak per fase een eigen component (bijv. HostQuestionView) zodat dit bestand klein blijft.
export default function HostGamePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { status } = useGameSession(code, 'host')
  const { connected, state, error } = useGameSocket(code, 'host', status === 'ok')
  const [lobbyUpdate, setLobbyUpdate] = useState(null)

  useSocketEvent(LOBBY_UPDATE, setLobbyUpdate)
  useSocketEvent(GAME_CLOSED, ({ reason }) => {
    message.info(reason)
    navigate('/')
  })

  // De nieuwste lobby-info: eerst uit game:sync, daarna uit elke lobby:update.
  const lobby = lobbyUpdate ?? state?.lobby
  const phase = state?.phase

  async function send(event, payload) {
    const response = await emitWithAck(event, payload)
    if (!response.ok) message.warning(response.message)
    return response
  }

  async function endGame() {
    const response = await send(HOST_END)
    if (response.ok) navigate('/')
  }

  if (status === 'loading') return <Spin size="large" style={{ display: 'block', margin: 40 }} />
  if (status !== 'ok' || error) {
    return (
      <Result
        status="warning"
        title="Je bent niet de host van deze game"
        subTitle="De game bestaat niet meer, of je hebt hem in een andere browser aangemaakt."
        extra={<Link to="/quizzes">Nieuwe game starten</Link>}
      />
    )
  }

  return (
    <Flex vertical gap={16}>
      {!connected && <Alert type="warning" title="Verbinding met de server kwijt…" showIcon />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card style={{ textAlign: 'center' }}>
            <Typography.Text type="secondary">{state?.quizTitle}</Typography.Text>
            <Typography.Title style={{ fontSize: 64, letterSpacing: 8, margin: '8px 0' }}>
              {code}
            </Typography.Title>
            <JoinQrCode code={code} />
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            title={`Spelers (${lobby?.playerCount ?? 0})`}
            extra={
              <Button
                icon={lobby?.locked ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => send(HOST_LOCK, { locked: !lobby?.locked })}
              >
                {lobby?.locked ? 'Lobby openen' : 'Lobby op slot'}
              </Button>
            }
          >
            {lobby?.locked && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                title="De lobby zit op slot: geen nieuwe spelers, terugkomen kan wel."
              />
            )}
            <PlayerList players={lobby?.players} />
          </Card>

          <Flex gap={8} style={{ marginTop: 16 }} wrap>
            <Button
              type="primary"
              size="large"
              disabled={!lobby?.playerCount}
              onClick={() => send(HOST_START)}
            >
              Start quiz
            </Button>
            <Button size="large" danger onClick={endGame}>
              Afsluiten
            </Button>
          </Flex>
        </Col>
      </Row>

      {phase && phase !== 'LOBBY' && (
        <Card>TODO(team): scherm voor fase {phase} (zie het commentaar bovenaan dit bestand)</Card>
      )}
    </Flex>
  )
}
