import { describe, expect, it } from 'vitest'
import { isTokenUsable } from '../auth/tokenRules.js'

// USER IMPLEMENTATION S3 — backend/auth/tokenRules.js (isTokenUsable)
describe('eenmalige link geldig? (S3)', () => {
  const now = new Date('2026-10-26T12:00:00Z')
  const later = new Date('2026-10-26T13:00:00Z')
  const earlier = new Date('2026-10-26T11:00:00Z')

  it('niet gebruikt en niet verlopen: geldig', () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: later }, now)).toBe(true)
  })

  it('al gebruikt: ongeldig, ook als hij nog niet verlopen is', () => {
    expect(isTokenUsable({ usedAt: earlier, expiresAt: later }, now)).toBe(false)
  })

  it('verlopen: ongeldig', () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: earlier }, now)).toBe(false)
  })

  it('precies op het verloopmoment: ongeldig', () => {
    expect(isTokenUsable({ usedAt: null, expiresAt: now }, now)).toBe(false)
  })
})
