// REFERENTIE — deze versie wordt NIET door de app gebruikt.
// Dit was de skeleton-versie van client/src/pages/PlayerGamePage.jsx voordat die leeggehaald werd.
// Gebruik dit als voorbeeld/inspiratie; kopieer stukken over naar client/src/pages/PlayerGamePage.jsx.
// Zie docs/reference/README.md.

import { Alert, Button, Card, Result, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/http.js'
import { useGameSession } from '../hooks/useGameSession.js'
import { useGameSocket } from '../hooks/useGameSocket.js'
import { useSocketEvent } from '../hooks/useSocketEvent.js'
import { GAME_CLOSED, GAME_PHASE } from '../socket/events.js'

// Speler-scherm (telefoon): wachten → vraag → resultaat → eindscherm (projectplan 3.2 stap 3–6).
//
// KLAAR: sessie-check + rejoin via cookie quiz_player, wachtscherm, lobby verlaten, game gesloten.
// TODO(team):
// - Fase 4: QUESTION_SHOW → vraagtekst + <AnswerButtons />, versturen met PLAYER_ANSWER.
//   PLAYER_RESULT → goed/fout, punten erbij, huidige plek.
// - Fase 5: GAME_PODIUM → eindscherm: "Je bent #7 van 24" + <Scoreboard /> (eigen rij gemarkeerd).
// - Fase 6: GAME_RESTARTED → terug naar het wachtscherm; knop "Opnieuw spelen" = leave() hieronder.
// Tip: maak per fase een eigen component (bijv. PlayerQuestionView) zodat dit bestand klein blijft.
export default function PlayerGamePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { status, session } = useGameSession(code, 'player')
  const { connected, state, error } = useGameSocket(code, 'player', status === 'ok')
  const [phaseUpdate, setPhaseUpdate] = useState(null)

  // Geen (geldige) cookie voor deze game → terug naar het joinformulier.
  useEffect(() => {
    if (status === 'no-session' || error?.error === 'NO_SESSION') {
      navigate(`/join/${code}`, { replace: true })
    }
    if (status === 'not-found') {
      navigate('/join', { replace: true, state: { notice: 'Deze game bestaat niet meer.' } })
    }
  }, [status, error, code, navigate])

  useSocketEvent(GAME_PHASE, setPhaseUpdate)
  useSocketEvent(GAME_CLOSED, ({ reason }) => {
    navigate('/join', { replace: true, state: { notice: reason } })
  })

  const phase = phaseUpdate?.phase ?? state?.phase

  // Lobby verlaten: naam komt vrij en de cookie wordt gewist.
  async function leave() {
    await api(`/games/${code}/players/me`, { method: 'DELETE' }).catch(() => {})
    navigate('/join', { replace: true })
  }

  if (status !== 'ok') return <Spin size="large" style={{ display: 'block', margin: 40 }} />

  return (
    <Card style={{ maxWidth: 520, margin: '0 auto' }}>
      {!connected && (
        <Alert
          type="warning"
          showIcon
          title="Verbinding kwijt, we proberen opnieuw…"
          style={{ marginBottom: 16 }}
        />
      )}

      {(!phase || phase === 'LOBBY') && (
        <Result
          status="success"
          title="Je zit erin!"
          subTitle="Wacht tot de host de quiz start."
          extra={[
            <Typography.Title level={2} key="name">
              {session.nickname}
            </Typography.Title>,
            <Button key="leave" type="link" onClick={leave}>
              Lobby verlaten
            </Button>,
          ]}
        />
      )}

      {phase && phase !== 'LOBBY' && (
        <Typography.Paragraph>
          TODO(team): scherm voor fase {phase} (zie het commentaar bovenaan dit bestand)
        </Typography.Paragraph>
      )}
    </Card>
  )
}
