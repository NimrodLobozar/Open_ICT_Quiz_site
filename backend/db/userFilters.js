// Zoekfilter voor de gebruikerslijst van de beheerder (story 10).
// In een eigen bestand zonder database, zodat je het makkelijk kunt testen (backend/tests/userFilters.test.js).

/**
 * Maakt het Prisma-`where`-object voor de gebruikerslijst.
 * @param {{ role?: string | null, q?: string }} filters
 *   role: alleen deze rol ('STUDENT', 'TEACHER' of 'ADMIN'); leeg = alle rollen
 *   q: zoekterm; moet voorkomen in de gebruikersnaam óf het e-mailadres, hoofdletters maken niet uit
 */
export function buildUserWhere({ role, q }) {
  const where = {}
  if (role) where.role = role
  // USER IMPLEMENTATION (S10): als er een zoekterm q is, zet dan where.OR op een lijst van twee voorwaarden:
  // username bevat q, óf email bevat q, allebei zonder op hoofdletters te letten (Prisma: contains + mode).
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S10. Test: npx vitest run backend/tests/userFilters.test.js
  return where
}
