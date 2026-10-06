import { describe, expect, it } from 'vitest'
import { Game } from '../src/game/Game.js'
import { GameManager } from '../src/game/GameManager.js'
import { LOBBY } from '../src/game/phases.js'

// Een nep-quiz, zodat we geen database nodig hebben.
const quiz = {
  id: 1,
  title: 'Testquiz',
  questions: [
    {
      id: 1,
      text: 'Wat is 1 + 1?',
      timeLimitSec: 20,
      options: [
        { id: 1, text: '2', isCorrect: true },
        { id: 2, text: '3', isCorrect: false },
      ],
    },
  ],
}

function newGame(settings) {
  return new Game({ code: '123456', quiz, settings })
}

describe('Game: spelers toevoegen', () => {
  it('begint in de LOBBY zonder spelers', () => {
    const game = newGame()
    expect(game.phase).toBe(LOBBY)
    expect(game.getLobbyState()).toEqual({ players: [], locked: false, playerCount: 0 })
  })

  it('voegt een speler toe met een genormaliseerde naam', () => {
    const game = newGame()
    const player = game.addPlayer('  Sam  ')
    expect(player.nickname).toBe('Sam')
    expect(game.getLobbyState().playerCount).toBe(1)
  })

  it('weigert een dubbele naam (hoofdletterongevoelig)', () => {
    const game = newGame()
    game.addPlayer('Sam')
    expect(() => game.addPlayer('sam')).toThrow(expect.objectContaining({ code: 'NAME_TAKEN' }))
  })

  it('weigert nieuwe spelers als de lobby op slot zit', () => {
    const game = newGame()
    game.lock(true)
    expect(() => game.addPlayer('Sam')).toThrow(expect.objectContaining({ code: 'LOBBY_LOCKED' }))
  })

  it('weigert spelers als de lobby vol zit', () => {
    const game = newGame({ maxPlayers: 1 })
    game.addPlayer('Sam')
    expect(() => game.addPlayer('Lisa')).toThrow(expect.objectContaining({ code: 'LOBBY_FULL' }))
  })

  it('geeft de naam vrij als een speler zelf vertrekt', () => {
    const game = newGame()
    const sam = game.addPlayer('Sam')
    game.removePlayer(sam.id)
    expect(game.addPlayer('sam').nickname).toBe('sam')
  })

  it('houdt online/offline bij met meerdere tabs', () => {
    const game = newGame()
    const sam = game.addPlayer('Sam')
    game.setPlayerConnected(sam.id, true)
    game.setPlayerConnected(sam.id, true) // tweede tab
    game.setPlayerConnected(sam.id, false) // één tab dicht
    expect(game.players.get(sam.id).connected).toBe(true)
    game.setPlayerConnected(sam.id, false)
    expect(game.players.get(sam.id).connected).toBe(false)
  })

  it('stuurt nooit de juiste antwoorden mee in de lobby-state of publieke info', () => {
    const game = newGame()
    game.addPlayer('Sam')
    const json = JSON.stringify([game.getLobbyState(), game.getPublicInfo()])
    expect(json).not.toContain('isCorrect')
  })
})

describe('GameManager: sessies', () => {
  it('maakt een game met een code van 6 cijfers en een host-sessie', () => {
    const manager = new GameManager()
    const { game, hostToken } = manager.createGame(quiz, {})
    expect(game.code).toMatch(/^[1-9]\d{5}$/)
    expect(manager.getSession(hostToken)).toMatchObject({ gameCode: game.code, role: 'host' })
  })

  it('herkent een speler aan zijn token (rejoin), ook als de lobby op slot zit', () => {
    const manager = new GameManager()
    const { game } = manager.createGame(quiz, {})
    const { player, token } = manager.joinGame(game.code, 'Sam')
    game.lock(true)
    expect(manager.getSession(token)).toMatchObject({ playerId: player.id, role: 'player' })
  })

  it('maakt de token ongeldig als de speler vertrekt', () => {
    const manager = new GameManager()
    const { game } = manager.createGame(quiz, {})
    const { token } = manager.joinGame(game.code, 'Sam')
    manager.leaveGame(token)
    expect(manager.getSession(token)).toBeNull()
    expect(game.getLobbyState().playerCount).toBe(0)
  })

  it('geeft null voor een onbekende token', () => {
    expect(new GameManager().getSession('bestaat-niet')).toBeNull()
  })

  it('ruimt games op waarvan de host langer dan 10 minuten weg is', () => {
    const manager = new GameManager()
    const { game, hostToken } = manager.createGame(quiz, {})
    const elevenMinutesLater = Date.now() + 11 * 60 * 1000
    expect(manager.cleanup(elevenMinutesLater)).toEqual([game.code])
    expect(manager.findGame(game.code)).toBeUndefined()
    expect(manager.getSession(hostToken)).toBeNull()
  })

  it('ruimt een game met verbonden host niet op', () => {
    const manager = new GameManager()
    const { game } = manager.createGame(quiz, {})
    game.setHostConnected(true)
    expect(manager.cleanup(Date.now() + 60 * 60 * 1000)).toEqual([])
  })
})

// TODO(team, Fase 4-6): tests toevoegen voor start, submitAnswer, nextPhase, restart en getRanking.
