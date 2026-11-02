import { describe, expect, it } from 'vitest'
import { buildUserWhere } from '../db/userFilters.js'

// USER IMPLEMENTATION S10 — backend/db/userFilters.js (buildUserWhere)
describe('zoekfilter gebruikerslijst (S10)', () => {
  it('zonder filters: alle gebruikers', () => {
    expect(buildUserWhere({ role: null, q: '' })).toEqual({})
  })

  it('filter op rol', () => {
    expect(buildUserWhere({ role: 'TEACHER', q: '' })).toEqual({ role: 'TEACHER' })
  })

  it('zoekt in gebruikersnaam óf e-mailadres, zonder op hoofdletters te letten', () => {
    expect(buildUserWhere({ q: 'emma' })).toEqual({
      OR: [
        { username: { contains: 'emma', mode: 'insensitive' } },
        { email: { contains: 'emma', mode: 'insensitive' } },
      ],
    })
  })

  it('rol en zoeken samen', () => {
    const where = buildUserWhere({ role: 'STUDENT', q: 'hu.nl' })
    expect(where.role).toBe('STUDENT')
    expect(where.OR).toHaveLength(2)
  })
})
