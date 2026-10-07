import { Card, Typography } from 'antd'
import { useParams } from 'react-router-dom'

// Meedoen met een game (projectplan 3.2 stap 1–2).
//
// LEEGGEHAALD — bouw deze pagina zelf. Voorbeeld: docs/reference/pages/JoinPage.jsx
// Let op: deze pagina was al werkend in de skeleton en staat nu alleen nog in de referentie.
//
// Deze route bestaat twee keer: /join (zonder code) en /join/:code (met code, daar komt de
// QR-scan uit). Eén component, twee stappen:
//
// TODO(team, Fase 3):
// 1. /join — code van 6 cijfers invullen in een antd <Form> → navigate(`/join/${code}`).
//    Alleen cijfers toestaan: pattern /^\d{6}$/, normalize met value.replace(/\D/g, ''),
//    <Input inputMode="numeric" maxLength={6} /> zodat telefoons het cijfertoetsenbord tonen.
// 2. /join/:code — eerst useGameSession(code, 'player'):
//    - status 'ok' (geldige cookie quiz_player voor deze game) → meteen navigate(`/play/${code}`,
//      { replace: true }). Dat is de rejoin uit projectplan 6.1/3.3.
//    - anders: api(`/games/${code}`) ophalen → { exists, locked, phase, quizTitle }. Quiztitel
//      tonen, en bij locked een melding "Deze lobby is gesloten".
//    - naam invullen → POST /api/games/:code/players met body { nickname } → /play/:code.
//      Fouten error === 'NAME_TAKEN' of 'NAME_INVALID' bij het naamveld tonen
//      (form.setFields), de rest als <Alert>. Naamregels: projectplan hoofdstuk 5.
//    - bestaat de code niet? Terug naar stap 1 met de foutmelding erbij.
// 3. Melding uit een redirect tonen: location.state?.notice (bijv. "De host heeft de game
//    afgesloten."), wordt gezet door PlayerGamePage.
export default function JoinPage() {
  const { code } = useParams()

  return (
    <Card style={{ maxWidth: 420, margin: '0 auto' }}>
      <Typography.Title level={3}>Meedoen{code ? ` — game ${code}` : ''}</Typography.Title>
      TODO(team): code invullen + naam invullen bouwen (zie het commentaar bovenaan dit bestand).
    </Card>
  )
}
