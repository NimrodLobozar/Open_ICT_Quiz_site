import { describe, expect, it } from 'vitest'
import { calculatePoints, rankPlayers } from '../src/game/scoring.js'

describe('calculatePoints', () => {
  const timeLimitMs = 20_000

  it('geeft 0 punten voor een fout antwoord', () => {
    expect(calculatePoints({ correct: false, responseTimeMs: 1000, timeLimitMs })).toBe(0)
  })

  it('geeft 1000 punten voor een direct goed antwoord', () => {
    expect(calculatePoints({ correct: true, responseTimeMs: 0, timeLimitMs })).toBe(1000)
  })

  it('geeft 500 punten voor een goed antwoord op de valreep', () => {
    expect(calculatePoints({ correct: true, responseTimeMs: timeLimitMs, timeLimitMs })).toBe(500)
  })

  it('geeft 750 punten halverwege', () => {
    expect(calculatePoints({ correct: true, responseTimeMs: 10_000, timeLimitMs })).toBe(750)
  })

  it('rondt af op hele punten', () => {
    // 1000 * (1 - (3333 / 20000) / 2) = 916.675 → 917
    expect(calculatePoints({ correct: true, responseTimeMs: 3333, timeLimitMs })).toBe(917)
  })

  it('blijft tussen 500 en 1000, ook bij rare tijden', () => {
    expect(calculatePoints({ correct: true, responseTimeMs: -500, timeLimitMs })).toBe(1000)
    expect(calculatePoints({ correct: true, responseTimeMs: 99_999, timeLimitMs })).toBe(500)
  })
})

describe('rankPlayers', () => {
  it('sorteert van hoog naar laag', () => {
    const ranked = rankPlayers([
      { nickname: 'A', score: 100 },
      { nickname: 'B', score: 300 },
      { nickname: 'C', score: 200 },
    ])
    expect(ranked.map((p) => p.nickname)).toEqual(['B', 'C', 'A'])
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 3])
  })

  it('geeft gelijke scores dezelfde plek: 1, 1, 3', () => {
    const ranked = rankPlayers([
      { nickname: 'A', score: 500 },
      { nickname: 'B', score: 500 },
      { nickname: 'C', score: 100 },
    ])
    expect(ranked.map((p) => p.rank)).toEqual([1, 1, 3])
  })

  it('werkt ook met gelijke scores lager in de lijst: 1, 2, 2, 2, 5', () => {
    const scores = [900, 400, 400, 400, 100]
    const ranked = rankPlayers(scores.map((score) => ({ score })))
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 2, 2, 5])
  })

  it('verandert de originele lijst niet', () => {
    const players = [{ score: 1 }, { score: 2 }]
    rankPlayers(players)
    expect(players).toEqual([{ score: 1 }, { score: 2 }])
  })
})
