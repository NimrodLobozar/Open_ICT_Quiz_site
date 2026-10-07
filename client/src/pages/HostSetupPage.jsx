import { Card, Typography } from 'antd'

// Instellingen voordat de lobby opent (projectplan 3.1 stap 3).
//
// LEEGGEHAALD — bouw deze pagina zelf. Voorbeeld: docs/reference/pages/HostSetupPage.jsx
//
// TODO(team, Fase 1–2 afmaken):
// - `quizId` uit de URL halen met useParams() en de quiz ophalen: api(`/quizzes/${quizId}`).
//   Toon titel + aantal vragen (quiz.questions.length).
// - antd <Form> met de instellingen: maxPlayers, timePerQuestion, questionPreviewSeconds
//   (zie projectplan 3.4 voor de vraagmodus). Standaardwaarden afstemmen met het team.
// - Knop "Lobby openen" → POST /api/games met body { quizId: Number(quizId), settings }.
//   De server maakt de game aan, zet de cookie quiz_host en geeft { gameCode } terug.
// - Daarna navigate(`/host/${gameCode}`).
// - Fouten tonen met App.useApp() → message.error(error.message).
export default function HostSetupPage() {
  return (
    <Card style={{ maxWidth: 520, margin: '0 auto' }}>
      <Typography.Title level={3}>Instellingen</Typography.Title>
      TODO(team): instellingen-formulier + "Lobby openen" bouwen (zie het commentaar bovenaan dit
      bestand).
    </Card>
  )
}
