import { describe, expect, it } from 'vitest'
import { Game } from '../game/Game.js'

// Test de vertaling naar databaserijen (Game.toSessionRecord), zonder echte database.
describe('Game.toSessionRecord', () => {
  it('geeft niets terug zolang er geen eindstand is', () => {
    expect(new Game('482913').toSessionRecord()).toBeNull()
  })

  it('bewaart per speler de plek van getRanking, met gedeelde plekken', () => {
    const game = new Game('482913')
    const anna = game.addPlayer('Anna', { skills: { Frontend: 4 } })
    const bram = game.addPlayer('Bram')
    const cas = game.addPlayer('Cas', { isBot: true })
    game.recordAnswer(anna.id, { questionIndex: 0, correct: true, points: 800 })
    game.recordAnswer(bram.id, { questionIndex: 0, correct: true, points: 800 })
    game.recordAnswer(cas.id, { questionIndex: 0, correct: false, points: 0 })
    game.finish()

    const endedAt = new Date('2026-10-13T10:00:00Z')
    const record = game.toSessionRecord(endedAt)

    expect(record).toMatchObject({ code: '482913', round: 1, startedAt: game.startedAt, endedAt })
    expect(record.results).toEqual([
      { nickname: 'Anna', score: 800, rank: 1, correctCount: 1, skills: { Frontend: 4 }, isBot: false },
      { nickname: 'Bram', score: 800, rank: 1, correctCount: 1, skills: {}, isBot: false },
      { nickname: 'Cas', score: 0, rank: 3, correctCount: 0, skills: {}, isBot: true },
    ])
  })

  it('telt de ronde op na een herstart', () => {
    const game = new Game('482913')
    game.addPlayer('Anna')
    game.finish()
    game.restart()
    game.finish()
    expect(game.toSessionRecord().round).toBe(2)
  })

  it('bewaart alleen geldige skills uit de browser', () => {
    const game = new Game('482913')
    const player = game.addPlayer('Anna', {
      skills: { Frontend: 3, Backend: 99, AI: 'veel', ['x'.repeat(41)]: 2, Cyber: 0 },
    })
    expect(player.skills).toEqual({ Frontend: 3, Cyber: 0 })
    expect(game.addPlayer('Bram', { skills: 'hack' }).skills).toEqual({})
  })
})
