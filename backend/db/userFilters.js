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
  if (q) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }
  return where
}
