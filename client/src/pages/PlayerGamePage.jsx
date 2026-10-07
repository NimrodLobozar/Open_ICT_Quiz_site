import { Card, Typography } from 'antd'
import { useParams } from 'react-router-dom'

// Speler-scherm (telefoon): wachten → vraag → resultaat → eindscherm (projectplan 3.2 stap 3–6).
//
// LEEGGEHAALD — bouw deze pagina zelf. Voorbeeld: docs/reference/pages/PlayerGamePage.jsx
// Let op: het sessie-/wachtscherm-gedeelte was al werkend in de skeleton en staat nu alleen nog in
// de referentie. Begin daarmee (punt 1 en 2 hieronder).
//
// TODO(team):
// 1. Sessie-check (projectplan 6.1): useGameSession(code, 'player') → bij status 'no-session'
//    terug naar `/join/${code}`, bij 'not-found' naar '/join' met een notice in location.state.
//    Pas bij 'ok' verbinden: useGameSocket(code, 'player', true).
// 2. Fase 3 — wachtscherm: "Je zit erin! Wacht tot de host start" + je eigen naam
//    (session.nickname), knop "Lobby verlaten" (DELETE /api/games/:code/players/me → '/join').
//    Op GAME_CLOSED naar '/join' met de reden als notice. Verbinding kwijt? antd <Alert>.
// 3. Fase 4 — QUESTION_SHOW → vraagtekst + <AnswerButtons />, antwoord versturen met
//    PLAYER_ANSWER. PLAYER_RESULT → goed/fout, punten erbij, huidige plek.
// 4. Fase 5 — GAME_PODIUM → eindscherm: "Je bent #7 van 24" + <Scoreboard /> met je eigen rij
//    gemarkeerd.
// 5. Fase 6 — GAME_RESTARTED → terug naar het wachtscherm; knop "Opnieuw spelen" = lobby verlaten.
//
// Tips: de huidige fase komt uit het event GAME_PHASE (en uit game:sync bij het verbinden).
// Eventnamen importeren uit ../socket/events.js, ontvangen met useSocketEvent(), versturen met
// emitWithAck(). Maak per fase een eigen component (bijv. PlayerQuestionView) zodat dit bestand
// klein blijft. Het event-contract staat in docs/SOCKET-EVENTS.md.
export default function PlayerGamePage() {
  const { code } = useParams()

  return (
    <Card style={{ maxWidth: 520, margin: '0 auto' }}>
      <Typography.Title level={3}>Speler-scherm — game {code}</Typography.Title>
      TODO(team): sessie-check, wachtscherm en de schermen per fase bouwen (zie het commentaar
      bovenaan dit bestand).
    </Card>
  )
}
