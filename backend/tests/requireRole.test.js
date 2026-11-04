import { describe, expect, it, vi } from 'vitest'
import { requireRole } from '../auth/middleware.js'

// USER IMPLEMENTATION S2 — backend/auth/middleware.js (requireRole)
// Middleware testen zonder server: we geven een nep-request en kijken of next() wordt aangeroepen of dat er een fout komt.
function run(middleware, user) {
  const next = vi.fn()
  try {
    middleware({ user }, {}, next)
    return { next, error: null }
  } catch (error) {
    return { next, error }
  }
}

describe('requireRole (S2)', () => {
  it('laat een gebruiker met de juiste rol door', () => {
    const { next, error } = run(requireRole('ADMIN'), { role: 'ADMIN' })
    expect(error).toBeNull()
    expect(next).toHaveBeenCalledOnce()
  })

  it('accepteert meerdere rollen', () => {
    expect(run(requireRole('TEACHER', 'ADMIN'), { role: 'TEACHER' }).next).toHaveBeenCalledOnce()
  })

  it('weigert een verkeerde rol met 403', () => {
    const { next, error } = run(requireRole('ADMIN'), { role: 'STUDENT' })
    expect(next).not.toHaveBeenCalled()
    expect(error).toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })

  it('weigert iemand die niet is ingelogd met 401', () => {
    const { next, error } = run(requireRole('ADMIN'), null)
    expect(next).not.toHaveBeenCalled()
    expect(error).toMatchObject({ status: 401, code: 'NOT_LOGGED_IN' })
  })
})
