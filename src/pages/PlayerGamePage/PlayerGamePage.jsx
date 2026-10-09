import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/http.js'
import QuizHeader from '../../components/QuizHeader.jsx'
import { useSocketEvent } from '../../hooks/useSocketEvent.js'
import { EVENTS } from '../../socket/events.js'
import { connectSocket, emitWithAck, socket } from '../../socket/socket.js'
import { PlayerEndScreen } from '../EndScreenPage_Player/EndScreenPage.jsx'
import '../EndScreenPage_Player/EndScreenPage.css'
import './PlayerGamePage.css'

/**
 * /play/:code: alles wat een speler tijdens een game ziet.
 * Welk scherm hangt af van de fase die de server stuurt (wachten → … → eindscherm).
 *
 * Hoe de data binnenkomt:
 * 1. Bij elke (her)verbinding vragen we de hele toestand op met game:sync. Zo werkt verversen.
 * 2. Daarna houden live-events (lobby:update, game:podium, player:result) de toestand bij.
 */
export default function PlayerGamePage() {
  const { code } = useParams()
  const navigate = useNavigate()
  // Wat de server ons vertelt: { phase, me, lobby, podium, result }. null = nog niets ontvangen.
  const [game, setGame] = useState(null)
  const [connected, setConnected] = useState(socket.connected)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState(null)

  // Eerst via REST checken of deze browser een speler-sessie heeft, pas dan de socket openen.
  useEffect(() => {
    let cancelled = false
    api(`/games/${code}/me`)
      .then(() => {
        if (!cancelled) connectSocket(code, 'player')
      })
      .catch(() => {
        // Geen (geldige) cookie: terug naar het joinformulier van deze game.
        if (!cancelled) navigate(`/join/${code}`, { replace: true })
      })

    return () => {
      cancelled = true
      // Pagina weg = verbinding dicht. De server zet ons dan op "offline".
      socket.disconnect()
    }
  }, [code, navigate])

  // 'connect' komt na de eerste verbinding én na elke automatische reconnect.
  // In beide gevallen kunnen we events gemist hebben, dus de hele toestand opnieuw opvragen.
  useSocketEvent('connect', async () => {
    setConnected(true)
    try {
      const response = await emitWithAck(EVENTS.GAME_SYNC)
      if (response.ok) setGame(response.state)
    } catch {
      // Geen antwoord binnen de timeout: de volgende reconnect probeert het opnieuw.
    }
  })

  useSocketEvent('disconnect', () => setConnected(false))

  // De middleware op de server weigerde ons (bijv. server herstart, sessie weg).
  useSocketEvent('connect_error', (error) => {
    if (error.message === 'NO_SESSION') navigate(`/join/${code}`, { replace: true })
  })

  useSocketEvent(EVENTS.LOBBY_UPDATE, (lobby) => {
    setGame((current) => current && { ...current, lobby })
  })

  // Broadcast naar iedereen: de quiz is klaar. Het eigen resultaat komt direct daarna (player:result).
  useSocketEvent(EVENTS.GAME_PODIUM, (podium) => {
    setGame((current) => current && { ...current, phase: 'PODIUM', podium, result: null })
  })

  // Alleen naar deze speler gestuurd.
  useSocketEvent(EVENTS.PLAYER_RESULT, (result) => {
    setGame((current) => current && { ...current, result })
  })

  // TODO(jij): luister naar EVENTS.GAME_RESTARTED. Zie docs/SOCKET-IO-UITLEG.md, hoofdstuk "Oefening".

  async function leaveGame() {
    setLeaving(true)
    setLeaveError(null)
    try {
      await api(`/games/${code}/players/me`, { method: 'DELETE' })
      socket.disconnect()
      navigate('/join')
    } catch {
      setLeaveError('Verlaten lukte niet. Controleer je verbinding en probeer het opnieuw.')
      setLeaving(false)
    }
  }

  return (
    <>
      {/* Bij zelf vertrekken verbreekt de server ons ook; dan is dit geen storing. */}
      {!connected && game && !leaving && (
        <p className="player-game__offline" role="status">
          Verbinding kwijt, opnieuw verbinden…
        </p>
      )}
      <PhaseScreen game={game} code={code} onLeave={leaveGame} leaving={leaving} leaveError={leaveError} />
    </>
  )
}

function PhaseScreen({ game, code, onLeave, leaving, leaveError }) {
  if (!game) return <WaitScreen code={code} title="Verbinden…" />

  if (game.phase === 'PODIUM' && game.podium) {
    return (
      <PlayerEndScreen
        code={code}
        ranking={game.podium.ranking}
        result={game.result}
        onLeave={onLeave}
        leaving={leaving}
        leaveError={leaveError}
      />
    )
  }

  if (game.phase === 'LOBBY') {
    return (
      <WaitScreen code={code} title="Je zit erin!">
        <p>
          Je speelt als <strong>{game.me?.nickname}</strong>. Wacht tot de host de quiz start.
        </p>
        <p>
          {game.lobby.playerCount} {game.lobby.playerCount === 1 ? 'speler' : 'spelers'} in de lobby
        </p>
      </WaitScreen>
    )
  }

  // TODO(team, fase 4): schermen voor de vraag, het resultaat per vraag en de tussenstand.
  return <WaitScreen code={code} title="De quiz is bezig…" />
}

function WaitScreen({ code, title, children }) {
  return (
    <div className="player-end">
      <QuizHeader code={code} />
      <main className="player-game__wait">
        <h1 className="player-game__title">{title}</h1>
        {children}
      </main>
    </div>
  )
}
