import { Card, Typography } from 'antd'
import { useParams } from 'react-router-dom'

// Host-scherm (digibord): lobby → vragen → tussenstand → podium (projectplan 3.1 stap 4–10).
//
// LEEGGEHAALD — bouw deze pagina zelf. Voorbeeld: docs/reference/pages/HostGamePage.jsx
// Let op: het sessie-/lobby-gedeelte was al werkend in de skeleton en staat nu alleen nog in de
// referentie. Begin daarmee (punt 1 en 2 hieronder), dan heb je iets om op verder te bouwen.
//
// TODO(team):
// 1. Sessie-check (projectplan 6.1): useGameSession(code, 'host') → status 'loading' | 'ok' |
//    'no-session' | 'not-found'. Pas bij 'ok' verbinden: useGameSocket(code, 'host', true).
//    Geen host van deze game? Toon een antd <Result> met een link naar /quizzes.
// 2. Fase 3 — lobby: joincode groot in beeld + <JoinQrCode code={code} />, live spelerslijst met
//    <PlayerList /> op het event LOBBY_UPDATE, knoppen "Lobby op slot" (HOST_LOCK),
//    "Start quiz" (HOST_START, alleen actief bij ≥ 1 speler) en "Afsluiten" (HOST_END).
//    Op GAME_CLOSED terug naar '/'. Ook: "12 / 100" spelers tonen, (optioneel) speler kicken.
// 3. Fase 4 — luister naar GAME_PHASE en QUESTION_SHOW / QUESTION_PROGRESS / QUESTION_END en toon
//    per fase een ander scherm (vraag + <QuestionTimer /> + "x van y heeft geantwoord", daarna het
//    juiste antwoord met hoeveel mensen wat kozen).
// 4. Fase 5 — LEADERBOARD_SHOW → <Leaderboard />, GAME_PODIUM → <Podium />, knop "Volgende vraag".
// 5. Fase 6 — knoppen "Quiz herstarten" (HOST_RESTART) en "Afsluiten" op het podium.
//
// Tips: eventnamen importeren uit ../socket/events.js (nooit als string), versturen met
// emitWithAck() uit ../socket/socket.js (geeft { ok } of { ok: false, message } terug), en events
// ontvangen met useSocketEvent(). Maak per fase een eigen component (bijv. HostQuestionView) zodat
// dit bestand klein blijft. Het event-contract staat in docs/SOCKET-EVENTS.md.
export default function HostGamePage() {
  const { code } = useParams()

  return (
    <Card>
      <Typography.Title level={3}>Host-scherm — game {code}</Typography.Title>
      TODO(team): sessie-check, lobby en de schermen per fase bouwen (zie het commentaar bovenaan
      dit bestand).
    </Card>
  )
}
