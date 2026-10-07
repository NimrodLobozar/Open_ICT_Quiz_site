import { Card, Typography } from 'antd'

// Quiz-overzicht met zoekbalk (projectplan 3.1 stap 2).
//
// LEEGGEHAALD — bouw deze pagina zelf. Voorbeeld: docs/reference/pages/QuizBrowsePage.jsx
//
// TODO(team, Fase 1–2 afmaken):
// - Quizzen ophalen met `api('/quizzes?search=...')` uit ../api/http.js in een useEffect.
//   De response is een array: { id, title, description, questionCount, role: { name, color } }.
// - Zolang je nog niets hebt: antd <Spin />. Niets gevonden: antd <Empty />.
// - Lijst tonen met antd <Row>/<Col> + <Card> per quiz (mobiel 1 kolom, desktop 3).
// - Zoekbalk met antd <Input.Search /> die de zoekterm in state zet.
// - Per quiz een knop "Host" → navigate(`/host/new/${quiz.id}`).
// - Filteren op beroepsrol (quiz.role), nettere kaarten, laadstatus per zoekactie.
export default function QuizBrowsePage() {
  return (
    <>
      <Typography.Title level={2}>Kies een quiz</Typography.Title>
      <Card>
        TODO(team): quiz-overzicht met zoekbalk bouwen (zie het commentaar bovenaan dit bestand).
      </Card>
    </>
  )
}
