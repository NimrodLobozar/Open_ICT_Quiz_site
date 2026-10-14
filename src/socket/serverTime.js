/**
 * Zet startsAt van de server om naar de klok van deze browser.
 *
 * Waarom: de klok van een laptop of telefoon kan seconden afwijken van de server.
 * Zou je startsAt direct gebruiken, dan telt een scherm met een verkeerde klok verkeerd af.
 * De server stuurt daarom serverTime mee ("zo laat is het bij mij"). Het verschil tussen
 * serverTime en startsAt klopt altijd, dus dat verschil tellen we op bij onze eigen klok.
 * (De paar milliseconden die het bericht onderweg was, negeren we.)
 *
 * @param {{ startsAt: number, serverTime: number } | null} question  payload van question:show
 */
export function withLocalStartsAt(question) {
  if (!question) return null
  return { ...question, startsAt: Date.now() + (question.startsAt - question.serverTime) }
}
