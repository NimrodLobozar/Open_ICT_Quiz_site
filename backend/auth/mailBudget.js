import { ApiError } from '../utils/ApiError.js'

// Hoeveel bevestigingsmails voor een nieuw e-mailadres één account mag laten versturen (Instellingen):
// 5 per kwartier, net als de andere mailroutes (zie rateLimits.js).
//
// Waarom geen gewone express-rate-limit? Die beslist vóór de route, met de gebruikersgegevens van het begin
// van het verzoek. Komen er verzoeken tegelijk binnen, dan kan het antwoord "verstuurt dit een mail?" onder het
// gebruikersslot anders uitvallen. Deze teller roep je pas aan op het moment dat er écht een mail komt,
// binnen het slot. JavaScript draait één ding tegelijk, dus controleren + bijschrijven gebeurt in één keer.
const WINDOW_MS = 15 * 60 * 1000
const LIMIT = 5

/** @type {Map<string, number[]>} account → tijdstippen van verstuurde mails */
const sent = new Map()

/**
 * Mag dit account nu een bevestigingsmail laten sturen? Zo ja, dan telt deze mee; zo nee, ApiError 429.
 * @param {{ id: number, createdAt: Date }} user
 */
export function takeEmailChangeMail(user, now = Date.now()) {
  // id + aanmaakmoment: uniek per account, ook als een id na het legen van de database opnieuw wordt uitgedeeld.
  const key = `${user.id}:${user.createdAt.getTime()}`
  const recent = (sent.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  if (recent.length >= LIMIT) {
    sent.set(key, recent)
    throw new ApiError(
      'TOO_MANY_REQUESTS',
      'Je hebt al een paar mails aangevraagd. Kijk in je inbox (en spam), of probeer het over een kwartier opnieuw.',
      429,
    )
  }
  recent.push(now)
  sent.set(key, recent)
}
