import { describe, expect, it } from 'vitest'
import {
  checkName,
  isNameTaken,
  nameKey,
  normalizeName,
  validateName,
} from '../src/game/nameRules.js'

describe('normalizeName', () => {
  it('haalt spaties aan begin en eind weg', () => {
    expect(normalizeName('  Sam  ')).toBe('Sam')
  })

  it('maakt van meerdere spaties één spatie', () => {
    expect(normalizeName('Sam    de   Vries')).toBe('Sam de Vries')
  })

  it('kan tegen undefined en null', () => {
    expect(normalizeName(undefined)).toBe('')
    expect(normalizeName(null)).toBe('')
  })
})

describe('validateName', () => {
  it('accepteert een normale naam', () => {
    expect(validateName('Sam')).toEqual({ ok: true, name: 'Sam' })
  })

  it('accepteert letters met accenten en - _ .', () => {
    expect(validateName('Nimród_é.ö-1').ok).toBe(true)
  })

  it('weigert te korte namen (ook na trimmen)', () => {
    expect(validateName('A').ok).toBe(false)
    expect(validateName('   A   ').error).toBe('NAME_INVALID')
  })

  it('accepteert precies 2 en precies 20 tekens', () => {
    expect(validateName('Ab').ok).toBe(true)
    expect(validateName('a'.repeat(20)).ok).toBe(true)
  })

  it('weigert te lange namen', () => {
    expect(validateName('a'.repeat(21)).ok).toBe(false)
  })

  it('weigert vreemde tekens', () => {
    expect(validateName('<script>').ok).toBe(false)
    expect(validateName('Sam!').ok).toBe(false)
    expect(validateName('Sam 😀').ok).toBe(false)
  })
})

describe('naam-uniekheid (hoofdletterongevoelig)', () => {
  it('ziet "Nimród", "nimród" en " NIMRÓD " als dezelfde naam', () => {
    expect(nameKey('Nimród')).toBe(nameKey('nimród'))
    expect(nameKey('Nimród')).toBe(nameKey(' NIMRÓD '))
  })

  it('ziet "Sam  Smit" en "sam smit" als dezelfde naam', () => {
    expect(isNameTaken('sam smit', ['Sam  Smit'])).toBe(true)
  })

  it('ziet verschillende namen als verschillend', () => {
    expect(isNameTaken('Sam', ['Samira', 'Sem'])).toBe(false)
  })

  it('checkName geeft NAME_TAKEN als de naam al bezet is', () => {
    const result = checkName('sam', ['Sam'])
    expect(result.ok).toBe(false)
    expect(result.error).toBe('NAME_TAKEN')
  })

  it('checkName geeft de genormaliseerde naam terug als alles goed is', () => {
    expect(checkName('  Sam   Smit ', ['Lisa'])).toEqual({ ok: true, name: 'Sam Smit' })
  })
})
