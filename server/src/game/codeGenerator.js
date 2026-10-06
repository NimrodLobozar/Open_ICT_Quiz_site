// Joincodes van 6 cijfers (100000 t/m 999999).
import { randomInt } from 'node:crypto'

const MIN_CODE = 100000
const MAX_CODE = 999999
const MAX_ATTEMPTS = 1000

/**
 * Maakt een willekeurige code die nog niet in gebruik is.
 * @param {(code: string) => boolean} isInUse geeft true als de code al bij een actieve game hoort
 * @returns {string}
 */
export function generateCode(isInUse = () => false) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // randomInt(min, max) geeft een getal van min t/m max - 1
    const code = String(randomInt(MIN_CODE, MAX_CODE + 1))
    if (!isInUse(code)) return code
  }
  throw new Error('Kon geen vrije joincode vinden')
}

/** Is dit een geldige joincode (precies 6 cijfers, niet beginnend met 0)? */
export function isValidCode(code) {
  return /^[1-9]\d{5}$/.test(String(code))
}
