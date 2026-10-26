import { describe, expect, it } from 'vitest'
import { summarizeResults } from '../results/summary.js'

// USER IMPLEMENTATION S4 — backend/results/summary.js (bestRank en podiumCount)
describe('samenvatting op Mijn account (S4)', () => {
  it('nog niets gespeeld: lege staat, geen fout', () => {
    expect(summarizeResults([])).toEqual({ played: 0, bestRank: null, podiumCount: 0, correctPercent: null })
  })

  it('beste plaats is de laagste rank', () => {
    const rows = [
      { rank: 4, correctCount: 5, questionCount: 8 },
      { rank: 1, correctCount: 8, questionCount: 8 },
      { rank: 9, correctCount: 2, questionCount: 8 },
    ]
    expect(summarizeResults(rows).bestRank).toBe(1)
  })

  it('podium = plaats 1, 2 of 3 (ook een gedeelde plaats telt)', () => {
    const rows = [1, 2, 2, 3, 4, 9].map((rank) => ({ rank, correctCount: 0, questionCount: 8 }))
    expect(summarizeResults(rows).podiumCount).toBe(4)
  })

  it('% goed over alle vragen samen, afgerond', () => {
    const rows = [
      { rank: 2, correctCount: 7, questionCount: 8 },
      { rank: 5, correctCount: 3, questionCount: 10 },
    ]
    expect(summarizeResults(rows)).toEqual({ played: 2, bestRank: 2, podiumCount: 1, correctPercent: 56 })
  })
})
