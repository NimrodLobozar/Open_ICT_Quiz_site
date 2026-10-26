/**
 * Mag deze eenmalige link (wachtwoord vergeten of docent-uitnodiging) nog gebruikt worden?
 * Alleen als hij nog niet gebruikt is én nog niet verlopen.
 * Losse functie zonder database, zodat je hem makkelijk kunt testen (backend/tests/tokenRules.test.js).
 * @param {{ usedAt: Date | null, expiresAt: Date }} record een rij uit OneTimeToken
 * @param {Date} [now]
 */
export function isTokenUsable(record, now = new Date()) {
  // USER IMPLEMENTATION (S3): geef true terug als de link nog niet gebruikt is (usedAt is null)
  // ÉN nog niet verlopen (expiresAt ligt ná now). Anders false.
  // Tot je dit invult, is elke link ongeldig (veilig: liever geen reset dan een reset met een oude link).
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S3. Test: npx vitest run backend/tests/tokenRules.test.js
  return false
}
