import { describe, expect, it } from 'vitest'
import { huEmailTypingError, isHuEmail } from '../../src/utils/schoolEmail.js'

// Story 14: alleen @student.hu.nl en @hu.nl.
describe('isHuEmail', () => {
  it.each(['emma@student.hu.nl', 's.bakker@hu.nl', 'Naam@Student.HU.nl', '  daan@hu.nl  '])('accepteert %s', (email) => {
    expect(isHuEmail(email)).toBe(true)
  })

  it.each([
    'emma@gmail.com',
    'emma@nephu.nl', // eindigt op "hu.nl", maar is een ander domein
    'emma@hu.nl.voorbeeld.com', // begint met "hu.nl"
    'emma@studenthu.nl',
    'emma@mail.hu.nl', // ander subdomein
    'emma@student.hu.nl@gmail.com', // twee keer @
    '@hu.nl', // niets voor de @
    'hu.nl',
    '',
  ])('weigert %s', (email) => {
    expect(isHuEmail(email)).toBe(false)
  })

  it('weigert iets dat geen tekst is', () => {
    expect(isHuEmail(undefined)).toBe(false)
    expect(isHuEmail(null)).toBe(false)
    expect(isHuEmail(42)).toBe(false)
  })
})

describe('huEmailTypingError', () => {
  it.each(['emma', 'emma@', 'emma@stu', 'emma@student.hu.n', 'emma@h', 'emma@hu.nl'])('zegt nog niets bij "%s"', (value) => {
    expect(huEmailTypingError(value)).toBeNull()
  })

  it.each(['emma@gmail', 'emma@nephu.nl', 'emma@hu.nl.voorbeeld.com', 'a@b@hu.nl'])('meldt het bij "%s"', (value) => {
    expect(huEmailTypingError(value)).toMatch(/HU-mailadres/)
  })
})
