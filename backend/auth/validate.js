import { isStrongPassword } from '../../src/utils/passwordRules.js'
import { nameKey, normalizeName, validateName } from '../game/nameRules.js'
import { ApiError } from '../utils/ApiError.js'

// Invoercontrole voor accounts. De frontend controleert ook, maar dat is alleen voor het gemak:
// iemand kan de API ook zonder onze pagina aanroepen, dus de server controleert altijd zelf.

// Simpele controle: iets@iets.iets, zonder spaties. Een perfecte e-mail-regex bestaat niet;
// of het adres écht bestaat, merk je pas als er een mail aankomt.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** E-mailadres in kleine letters zonder spaties, of een ApiError. */
export function parseEmail(raw) {
  const email = String(raw ?? '').trim().toLowerCase()
  if (email.length > 254 || !EMAIL.test(email)) {
    throw new ApiError('EMAIL_INVALID', 'Vul een geldig e-mailadres in.', 400)
  }
  return email
}

/**
 * Gebruikersnaam volgens dezelfde regels als een spelersnaam (2 tot 20 tekens),
 * want met een account is dit de naam op het grote scherm.
 * @returns {{ username: string, usernameKey: string }}
 */
export function parseUsername(raw) {
  const username = normalizeName(raw)
  if (validateName(username)) {
    throw new ApiError('USERNAME_INVALID', 'Gebruik 2 tot 20 letters, cijfers, spaties, - _ of .', 400)
  }
  return { username, usernameKey: nameKey(username) }
}

export function parsePassword(raw) {
  if (!isStrongPassword(raw)) {
    throw new ApiError(
      'PASSWORD_WEAK',
      'Je wachtwoord moet minstens 8 tekens hebben, met een cijfer en een hoofdletter.',
      400,
    )
  }
  return raw
}

/** Een id uit de URL (/users/:id). Geen getal = 404, alsof hij niet bestaat. */
export function parseId(raw) {
  const id = Number(raw)
  if (!Number.isSafeInteger(id) || id < 1) throw new ApiError('NOT_FOUND', 'Niet gevonden.', 404)
  return id
}

/** Paginanummer uit de query (?page=2), minimaal 1. */
export function parsePage(raw) {
  const page = Number(raw)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

/** Zoekterm uit de query (?q=...), ingekort zodat niemand een enorme zoekopdracht stuurt. */
export function parseSearch(raw) {
  return typeof raw === 'string' ? raw.trim().slice(0, 100) : ''
}
