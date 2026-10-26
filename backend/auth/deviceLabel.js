/**
 * Maakt van de User-Agent van de browser een kort, leesbaar label voor de lijst "Ingelogd op" (story 9),
 * bijv. "Telefoon · Safari" of "Computer · Chrome".
 * We bewaren bewust alleen dit label, niet de hele User-Agent of het IP-adres: minder persoonsgegevens (AVG).
 * @param {string | undefined} userAgent
 */
export function deviceLabel(userAgent) {
  // USER IMPLEMENTATION (S9): maak van de User-Agent een label als "Telefoon · Safari" of "Computer · Chrome".
  // Leeg of undefined → 'Onbekend apparaat'. Onbekende browser → alleen het apparaat, bijv. 'Computer'.
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S9. Test: npx vitest run backend/tests/deviceLabel.test.js
  return 'Onbekend apparaat'
}
