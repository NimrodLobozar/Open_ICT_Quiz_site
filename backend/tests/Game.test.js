import { beforeEach, describe, expect, it } from 'vitest'
import { Game } from '../game/Game.js'
import { PHASES } from '../game/phases.js'

describe('Game', () => {
  let game

  beforeEach(() => {
    game = new Game('482913', { totalQuestions: 3 })
  })

  it('weigert dezelfde naam met andere hoofdletters of spaties', () => {
    game.addPlayer('Nimród')
    expect(() => game.addPlayer('  NIMRÓD ')).toThrow(expect.objectContaining({ code: 'NAME_TAKEN' }))
  })

  it('weigert te korte, te lange en rare namen', () => {
    expect(() => game.addPlayer('A')).toThrow(expect.objectContaining({ code: 'NAME_INVALID' }))
    expect(() => game.addPlayer('x'.repeat(21))).toThrow(expect.objectContaining({ code: 'NAME_INVALID' }))
    expect(() => game.addPlayer('<script>')).toThrow(expect.objectContaining({ code: 'NAME_INVALID' }))
  })

  it('geeft de naam vrij als een speler vertrekt', () => {
    const sam = game.addPlayer('Sam')
    game.removePlayer(sam.id)
    expect(() => game.addPlayer('sam')).not.toThrow()
  })

  it('telt de totaalscore op uit de punten per vraag', () => {
    const emma = game.addPlayer('Emma')
    game.recordAnswer(emma.id, { questionIndex: 0, correct: true, points: 900 })
    game.recordAnswer(emma.id, { questionIndex: 1, correct: false, points: 0 })
    game.recordAnswer(emma.id, { questionIndex: 2, correct: true, points: 700 })
    expect(emma.score).toBe(emma.answers.reduce((sum, answer) => sum + answer.points, 0))
    expect(emma.correctCount).toBe(2)
  })

  it('zet bij finish de eindstand gelijk aan de laatste tussenstand', () => {
    const a = game.addPlayer('Anna')
    const b = game.addPlayer('Bram')
    game.recordAnswer(a.id, { questionIndex: 0, correct: true, points: 800 })
    game.recordAnswer(b.id, { questionIndex: 0, correct: true, points: 800 })
    const lastLeaderboard = game.getRanking()

    game.finish()

    expect(game.phase).toBe(PHASES.PODIUM)
    expect(game.finalRanking).toEqual(lastLeaderboard)
    expect(game.getPlayerResult(b.id)).toMatchObject({ rank: 1, playerCount: 2 })
  })

  it('houdt de eindstand gelijk als een speler na het podium vertrekt', () => {
    const a = game.addPlayer('Anna')
    const b = game.addPlayer('Bram')
    game.recordAnswer(a.id, { questionIndex: 0, correct: true, points: 800 })
    game.finish()
    game.removePlayer(a.id)
    expect(game.getPlayerResult(b.id)).toMatchObject({ rank: 2, playerCount: 2, pointsToNext: 800 })
  })

  it('laat geen nieuwe spelers toe na de start', () => {
    game.finish()
    expect(() => game.addPlayer('Laat')).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }))
  })

  it('houdt bij restart dezelfde spelers en namen, met score 0, in de lobby', () => {
    const emma = game.addPlayer('Emma')
    game.recordAnswer(emma.id, { questionIndex: 0, correct: true, points: 1000 })
    game.finish()

    game.restart()

    expect(game.phase).toBe(PHASES.LOBBY)
    expect(game.finalRanking).toBeNull()
    expect(game.getPlayer(emma.id)).toMatchObject({ nickname: 'Emma', score: 0, correctCount: 0, answers: [] })
  })
})
