import { describe, expect, it } from 'vitest'
import { getRanking } from '../../src/utils/ranking.js'
import { buildPlayerResult } from '../../src/utils/playerResult.js'

const ranking = getRanking([
  { id: 1, nickname: 'Sanne', score: 7420, correctCount: 8, isVerified: true },
  { id: 2, nickname: 'Mo', score: 6150, correctCount: 7, isVerified: false },
  { id: 3, nickname: 'Fatima', score: 6150, correctCount: 7, isVerified: true },
  { id: 4, nickname: 'Lotte', score: 4120, correctCount: 6, isVerified: false },
  { id: 5, nickname: 'Emma', score: 3720, correctCount: 5, isVerified: false },
  { id: 6, nickname: 'Tim_04', score: 0, correctCount: 0, isVerified: false },
])

describe('buildPlayerResult', () => {
  it('geeft plek, aantal spelers, score en goede antwoorden', () => {
    expect(buildPlayerResult(ranking, 5, 8)).toMatchObject({
      nickname: 'Emma',
      rank: 5,
      playerCount: 6,
      totalScore: 3720,
      correctCount: 5,
      totalQuestions: 8,
      isGuest: true,
    })
  })

  it('rekent het verschil met de speler direct boven je uit', () => {
    expect(buildPlayerResult(ranking, 5, 8)).toMatchObject({ nextRank: 4, pointsToNext: 400 })
  })

  it('slaat een gelijke buurman over: bij gedeelde 2e plek is plek 1 de volgende', () => {
    expect(buildPlayerResult(ranking, 2, 8)).toMatchObject({ rank: 2, nextRank: 1, pointsToNext: 1270 })
  })

  it('geeft op plek 1 geen verschil (null), zodat de frontend een winstmelding toont', () => {
    expect(buildPlayerResult(ranking, 1, 8)).toMatchObject({ rank: 1, nextRank: null, pointsToNext: null })
  })

  it('werkt met 0 punten', () => {
    expect(buildPlayerResult(ranking, 6, 8)).toMatchObject({ rank: 6, totalScore: 0, nextRank: 5, pointsToNext: 3720 })
  })

  it('werkt met één speler: die heeft gewonnen', () => {
    const solo = getRanking([{ id: 1, nickname: 'Emma', score: 0, correctCount: 0, isVerified: false }])
    expect(buildPlayerResult(solo, 1, 8)).toMatchObject({ rank: 1, playerCount: 1, pointsToNext: null })
  })

  it('geeft bij iedereen gelijk iedereen plek 1 zonder verschil', () => {
    const tie = getRanking([
      { id: 1, nickname: 'A', score: 500, correctCount: 1, isVerified: false },
      { id: 2, nickname: 'B', score: 500, correctCount: 1, isVerified: false },
    ])
    expect(buildPlayerResult(tie, 2, 8)).toMatchObject({ rank: 1, nextRank: null, pointsToNext: null })
  })

  it('markeert spelers met een account niet als gast', () => {
    expect(buildPlayerResult(ranking, 1, 8).isGuest).toBe(false)
  })

  it('geeft null voor een onbekende speler', () => {
    expect(buildPlayerResult(ranking, 99, 8)).toBeNull()
  })
})
