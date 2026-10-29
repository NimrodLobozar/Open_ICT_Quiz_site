import { describe, expect, it } from 'vitest'
import { checkPassword, isStrongPassword } from '../../src/utils/passwordRules.js'

// USER IMPLEMENTATION S1 — src/utils/passwordRules.js
describe('wachtwoordregels (S1)', () => {
  it('heeft drie regels: lengte, cijfer en hoofdletter', () => {
    expect(checkPassword('').map((rule) => rule.id)).toEqual(['length', 'digit', 'upper'])
  })

  it('een cijfer telt alleen als er echt een cijfer in zit', () => {
    expect(checkPassword('abc').find((rule) => rule.id === 'digit').ok).toBe(false)
    expect(checkPassword('abc7').find((rule) => rule.id === 'digit').ok).toBe(true)
  })

  it('een hoofdletter telt, ook met een accent', () => {
    expect(checkPassword('abc').find((rule) => rule.id === 'upper').ok).toBe(false)
    expect(checkPassword('aBc').find((rule) => rule.id === 'upper').ok).toBe(true)
    expect(checkPassword('Élan').find((rule) => rule.id === 'upper').ok).toBe(true)
  })

  it.each([
    ['Geheim123', true],
    ['geheim123', false], // geen hoofdletter
    ['GeheimGeheim', false], // geen cijfer
    ['Gh1', false], // te kort
    ['A1' + 'a'.repeat(80), false], // langer dan bcrypt aankan (72 bytes)
  ])('isStrongPassword(%j) = %s', (password, expected) => {
    expect(isStrongPassword(password)).toBe(expected)
  })
})
