import { describe, expect, it } from 'vitest'
import { calculatePoints } from '../../src/utils/scoring.js'

describe('calculatePoints', () => {
  it('geeft 1000 voor een direct goed antwoord en 500 op de valreep', () => {
    expect(calculatePoints({ correct: true, responseMs: 0, timeLimitSec: 20 })).toBe(1000)
    expect(calculatePoints({ correct: true, responseMs: 20_000, timeLimitSec: 20 })).toBe(500)
    expect(calculatePoints({ correct: true, responseMs: 10_000, timeLimitSec: 20 })).toBe(750)
  })

  it('geeft 0 voor een fout antwoord, hoe snel ook', () => {
    expect(calculatePoints({ correct: false, responseMs: 0, timeLimitSec: 20 })).toBe(0)
  })

  it('geeft meer punten bij een hoger niveau: ×1 bij niveau 1 tot ×2 bij niveau 5', () => {
    const direct = (difficulty) => calculatePoints({ correct: true, responseMs: 0, timeLimitSec: 20, difficulty })
    expect(direct(1)).toBe(1000)
    expect(direct(3)).toBe(1500)
    expect(direct(5)).toBe(2000)
    expect(direct(null)).toBe(1000) // geen niveau (oude quiz): gewone punten
    expect(direct(9)).toBe(1000) // onzin telt als geen niveau
    expect(calculatePoints({ correct: false, responseMs: 0, timeLimitSec: 20, difficulty: 5 })).toBe(0)
  })

  it('blijft tussen 500 en 1000, ook bij rare tijden', () => {
    expect(calculatePoints({ correct: true, responseMs: -500, timeLimitSec: 20 })).toBe(1000)
    expect(calculatePoints({ correct: true, responseMs: 25_000, timeLimitSec: 20 })).toBe(500)
  })
})
