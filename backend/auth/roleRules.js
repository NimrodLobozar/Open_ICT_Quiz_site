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
  if (actor.id === target.id && newRole !== 'ADMIN') return 'OWN_ADMIN_ROLE'
  return null
}

/**
 * Mag `actor` het account van `target` verwijderen?
 * @returns {'DELETE_SELF' | null}
 */
export function deleteUserError(actor, target) {
  if (actor.id === target.id) return 'DELETE_SELF'
  return null
}
