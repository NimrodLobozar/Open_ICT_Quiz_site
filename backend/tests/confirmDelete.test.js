import { describe, expect, it } from 'vitest'
import { isDeleteConfirmed } from '../../src/utils/confirmDelete.js'

// USER IMPLEMENTATION S6 — src/utils/confirmDelete.js (isDeleteConfirmed)
describe('bevestiging account verwijderen (S6)', () => {
  it.each([
    ['VERWIJDER', true],
    ['  VERWIJDER ', true], // spaties eromheen tellen niet
    ['verwijder', false], // hoofdletters wel
    ['VERWIJDEREN', false],
    ['', false],
    [undefined, false],
  ])('%j → %s', (typed, expected) => {
    expect(isDeleteConfirmed(typed)).toBe(expected)
  })
})
