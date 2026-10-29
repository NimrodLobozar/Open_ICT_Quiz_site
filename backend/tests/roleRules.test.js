import { describe, expect, it } from 'vitest'
import { deleteUserError, roleChangeError } from '../auth/roleRules.js'

const jan = { id: 1, role: 'ADMIN' }
const emma = { id: 2, role: 'STUDENT' }

// USER IMPLEMENTATION S11 — backend/auth/roleRules.js (roleChangeError)
describe('rol wijzigen (S11)', () => {
  it('een beheerder mag de rol van een ander wijzigen', () => {
    expect(roleChangeError(jan, emma, 'TEACHER')).toBeNull()
  })

  it('een beheerder kan zijn eigen beheerdersrol niet weghalen', () => {
    expect(roleChangeError(jan, jan, 'STUDENT')).toBe('OWN_ADMIN_ROLE')
    expect(roleChangeError(jan, jan, 'TEACHER')).toBe('OWN_ADMIN_ROLE')
  })

  it('zichzelf "opnieuw" beheerder maken is geen probleem', () => {
    expect(roleChangeError(jan, jan, 'ADMIN')).toBeNull()
  })

  it('een rol die niet bestaat, mag nooit', () => {
    expect(roleChangeError(jan, emma, 'GOD')).toBe('INVALID_ROLE')
  })
})

// USER IMPLEMENTATION S12 — backend/auth/roleRules.js (deleteUserError)
describe('gebruiker verwijderen (S12)', () => {
  it('een beheerder mag een ander verwijderen', () => {
    expect(deleteUserError(jan, emma)).toBeNull()
  })

  it('een beheerder kan zichzelf niet via de beheertabel verwijderen', () => {
    expect(deleteUserError(jan, jan)).toBe('DELETE_SELF')
  })
})
