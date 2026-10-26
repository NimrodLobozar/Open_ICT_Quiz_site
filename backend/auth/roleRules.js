// Regels voor wat een beheerder met andere accounts mag (story 11 en 12).
// Losse functies zonder database of Express, zodat je ze makkelijk kunt testen (backend/tests/roleRules.test.js).
// Ze geven een foutcode terug, of null als het mag.

export const ROLES = ['STUDENT', 'TEACHER', 'ADMIN']

/**
 * Mag `actor` de rol van `target` veranderen in `newRole`?
 * @param {{ id: number }} actor de beheerder die het doet
 * @param {{ id: number, role: string }} target het account dat verandert
 * @param {string} newRole
 * @returns {'INVALID_ROLE' | 'OWN_ADMIN_ROLE' | null}
 */
export function roleChangeError(actor, target, newRole) {
  if (!ROLES.includes(newRole)) return 'INVALID_ROLE'
  // USER IMPLEMENTATION (S11): haalt een beheerder per ongeluk zijn eigen beheerdersrol weg, dan kan hij
  // niets meer terugzetten. Geef 'OWN_ADMIN_ROLE' terug als actor en target dezelfde persoon zijn
  // en de nieuwe rol níet 'ADMIN' is.
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S11. Test: npx vitest run backend/tests/roleRules.test.js
  return null
}

/**
 * Mag `actor` het account van `target` verwijderen?
 * @returns {'DELETE_SELF' | null}
 */
export function deleteUserError(actor, target) {
  // USER IMPLEMENTATION (S12): je eigen account verwijder je via Instellingen (met wachtwoord),
  // niet via de beheertabel. Geef 'DELETE_SELF' terug als actor en target dezelfde persoon zijn.
  // Stappenplan: docs/SPRINT-2-ZELF-IMPLEMENTEREN.md, opdracht S12. Test: npx vitest run backend/tests/roleRules.test.js
  return null
}
