import { describe, expect, it } from 'vitest'
import { getRanking } from '../../src/utils/ranking.js'

// Korte helper: van [naam, score]-paren naar de vorm die getRanking verwacht.
const players = (...rows) => rows.map(([nickname, score], i) => ({ id: i + 1, nickname, score }))
const ranks = (ranking) => ranking.map((row) => `${row.rank} ${row.nickname}`)

describe('getRanking', () => {
  it('geeft gelijke scores dezelfde plek en slaat daarna plekken over (1, 2, 2, 4)', () => {
    const ranking = getRanking(players(['Sanne', 7420], ['Mo', 6150], ['Fatima', 6150], ['Yara', 5880]))
    expect(ranks(ranking)).toEqual(['1 Sanne', '2 Fatima', '2 Mo', '4 Yara'])
  })

  it('werkt met één speler', () => {
    expect(ranks(getRanking(players(['Emma', 3720])))).toEqual(['1 Emma'])
  })

  it('geeft iedereen plek 1 als iedereen gelijk staat, gesorteerd op naam', () => {
    const ranking = getRanking(players(['Noah', 500], ['Daan', 500], ['Lucas', 500]))
    expect(ranks(ranking)).toEqual(['1 Daan', '1 Lucas', '1 Noah'])
  })

  it('werkt als iedereen 0 punten heeft', () => {
    const ranking = getRanking(players(['Tim_04', 0], ['Emma', 0]))
    expect(ranking.every((row) => row.rank === 1)).toBe(true)
  })

  it('geeft een lege lijst terug zonder spelers', () => {
    expect(getRanking([])).toEqual([])
  })

  it('verandert de invoer niet', () => {
    const input = players(['B', 1], ['A', 2])
    getRanking(input)
    expect(input.map((row) => row.nickname)).toEqual(['B', 'A'])
  })
})
