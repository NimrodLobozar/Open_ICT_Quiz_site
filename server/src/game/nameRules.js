// Regels voor spelersnamen (zie docs/PROJECTPLAN.md hoofdstuk 5).
// Dit bestand is VOLLEDIG geïmplementeerd en getest (tests/nameRules.test.js).
import { NAME_INVALID, NAME_TAKEN } from '../constants/errors.js'

export const MIN_LENGTH = 2
export const MAX_LENGTH = 20

// \p{L} = elke letter (ook é, ö, ł ...), \p{M} = losse accenttekens, \p{N} = cijfers.
const ALLOWED_CHARS = /^[\p{L}\p{M}\p{N} ._-]+$/u

/**
 * Maakt een naam netjes: spaties aan begin/eind weg, meerdere spaties → één spatie.
 * NFC zorgt dat "é" altijd als hetzelfde teken wordt opgeslagen (er bestaan twee manieren).
 * @param {string} raw
 * @returns {string}
 */
export function normalizeName(raw) {
  return String(raw ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * De "sleutel" waarmee we namen vergelijken: hoofdletterongevoelig.
 * "Nimród", "nimród" en " NIMRÓD " geven allemaal dezelfde sleutel.
 * @param {string} name
 * @returns {string}
 */
export function nameKey(name) {
  return normalizeName(name).toLowerCase()
}

/**
 * Controleert of een naam geldig is (los van andere spelers).
 * @param {string} raw
 * @returns {{ ok: true, name: string } | { ok: false, error: string, message: string }}
 */
export function validateName(raw) {
  const name = normalizeName(raw)
  // [...name] telt echte tekens (ook bij emoji/accenten), name.length soms niet.
  const length = [...name].length

  if (length < MIN_LENGTH || length > MAX_LENGTH) {
    return {
      ok: false,
      error: NAME_INVALID,
      message: `Je naam moet ${MIN_LENGTH} tot ${MAX_LENGTH} tekens lang zijn.`,
    }
  }
  if (!ALLOWED_CHARS.test(name)) {
    return {
      ok: false,
      error: NAME_INVALID,
      message: 'Gebruik alleen letters, cijfers, spaties, - _ en .',
    }
  }
  return { ok: true, name }
}

/**
 * Is deze naam al bezet in de lobby? Wie het eerst komt, houdt de naam.
 * @param {string} name
 * @param {Iterable<string>} existingNames namen van spelers die al in de lobby zitten
 * @returns {boolean}
 */
export function isNameTaken(name, existingNames) {
  const key = nameKey(name)
  for (const existing of existingNames) {
    if (nameKey(existing) === key) return true
  }
  return false
}

/**
 * Alles in één: valideren + uniek-check.
 * @param {string} raw
 * @param {Iterable<string>} existingNames
 * @returns {{ ok: true, name: string } | { ok: false, error: string, message: string }}
 */
export function checkName(raw, existingNames) {
  const result = validateName(raw)
  if (!result.ok) return result
  if (isNameTaken(result.name, existingNames)) {
    return { ok: false, error: NAME_TAKEN, message: 'Deze naam is al bezet. Kies een andere naam.' }
  }
  return result
}

// TODO(team, L1): account-spelers. Zit er al een gast met dezelfde naam, dan moet de
// account-speler in deze lobby een andere weergavenaam kiezen (zie Open punten in het projectplan).
