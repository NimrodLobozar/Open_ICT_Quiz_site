// Alleen HU-adressen mogen een account maken (story 14).
// Dit bestand wordt gedeeld door frontend (snelle melding tijdens het typen) en backend (de echte controle),
// net als ranking.js. Zo zijn ze het altijd met elkaar eens.

export const HU_EMAIL_DOMAINS = ['student.hu.nl', 'hu.nl']

export const HU_EMAIL_MESSAGE = 'Gebruik je HU-mailadres (@student.hu.nl of @hu.nl).'

/**
 * Eindigt het adres precies op @student.hu.nl of @hu.nl? Hoofdletters maken niet uit.
 * We vergelijken het hele deel na de @, niet "eindigt op hu.nl": anders komt @nephu.nl er ook door,
 * en "bevat hu.nl" laat @hu.nl.voorbeeld.com door.
 * @param {unknown} email
 */
export function isHuEmail(email) {
  if (typeof email !== 'string') return false
  const parts = email.trim().toLowerCase().split('@')
  // Precies één @, met iets ervoor.
  if (parts.length !== 2 || !parts[0]) return false
  return HU_EMAIL_DOMAINS.includes(parts[1])
}

/**
 * Melding tijdens het typen (alleen voor de frontend): null zolang het adres nog een HU-adres kán worden.
 * Bij "emma@stu" zeggen we nog niets; bij "emma@gmail" wel. Zo krijg je snel feedback zonder dat het
 * formulier al rood wordt terwijl je nog typt.
 * @param {string} value
 */
export function huEmailTypingError(value) {
  const at = value.indexOf('@')
  if (at === -1) return null
  const domain = value.slice(at + 1).trim().toLowerCase()
  const couldBecomeHu = HU_EMAIL_DOMAINS.some((allowed) => allowed.startsWith(domain))
  return couldBecomeHu ? null : HU_EMAIL_MESSAGE
}
