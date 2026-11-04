import { describe, expect, it } from 'vitest'
import { GUEST_DEFAULT_SKILL, joinStartSkills } from '../../src/utils/skills.js'

// Bug regel 5: met een nieuw account stonden alle sliders op de joinpagina op 5, terwijl je account 0 zegt.
describe('joinStartSkills (beginwaarden van de sliders)', () => {
  it('een nieuw account (nog niets opgeslagen) begint overal op 0', () => {
    expect(joinStartSkills({ skills: {} })).toEqual({ SD: 0, AI: 0, TI: 0, CSC: 0, GD: 0, BI: 0 })
  })

  it('een account begint op zijn opgeslagen waarden, de rest op 0', () => {
    expect(joinStartSkills({ skills: { SD: 4, BI: 1 } })).toEqual({ SD: 4, AI: 0, TI: 0, CSC: 0, GD: 0, BI: 1 })
  })

  it('een gast begint op de standaardwaarde', () => {
    expect(Object.values(joinStartSkills(null)).every((value) => value === GUEST_DEFAULT_SKILL)).toBe(true)
  })
})
