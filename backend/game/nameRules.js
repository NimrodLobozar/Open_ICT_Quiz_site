// Regels voor spelersnamen (projectplan hoofdstuk 5).

// Letters (ook met accenten), cijfers, spatie, - _ en .
const ALLOWED = /^[\p{L}\p{N} _.-]+$/u

// Spaties aan de randen weg en dubbele spaties samen, zodat "  Sam  " en "Sam" hetzelfde zijn.
export function normalizeName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ')
}

// Geeft een foutcode terug, of null als de naam goed is.
export function validateName(name) {
  if (name.length < 2 || name.length > 20) return 'NAME_INVALID'
  if (!ALLOWED.test(name)) return 'NAME_INVALID'
  return null
}

// Sleutel om namen te vergelijken: "Nimród", "nimród" en "NIMRÓD" zijn dezelfde naam.
export function nameKey(name) {
  return normalizeName(name).toLocaleLowerCase('nl-NL')
}
