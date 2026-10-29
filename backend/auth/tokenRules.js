/**
 * Mag deze eenmalige link (wachtwoord vergeten of docent-uitnodiging) nog gebruikt worden?
 * Alleen als hij nog niet gebruikt is én nog niet verlopen.
 * Losse functie zonder database, zodat je hem makkelijk kunt testen (backend/tests/tokenRules.test.js).
 * @param {{ usedAt: Date | null, expiresAt: Date }} record een rij uit OneTimeToken
 * @param {Date} [now]
 */
export function isTokenUsable(record, now = new Date()) {
  return record.usedAt === null && record.expiresAt > now
}
