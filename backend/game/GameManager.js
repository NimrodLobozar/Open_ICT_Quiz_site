import { randomBytes, randomInt } from 'node:crypto'
import { Game } from './Game.js'

// Alle actieve games en sessies, in het geheugen.
// Herstart de server, dan is alles weg; dat is geaccepteerd voor de MVP (projectplan 6).
class GameManager {
  constructor() {
    /** @type {Map<string, Game>} code → game */
    this.games = new Map()
    /** @type {Map<string, { code: string, role: 'host' | 'player', playerId?: number }>} token → sessie */
    this.sessions = new Map()
  }

  createGame(options) {
    const code = this.#newCode()
    const game = new Game(code, options)
    this.games.set(code, game)
    return game
  }

  getGame(code) {
    return this.games.get(code) ?? null
  }

  /**
   * Maakt een sessietoken voor in de cookie.
   * Alleen een willekeurige token, nooit een naam of id: anders kun je via DevTools iemand anders worden.
   */
  createSession(session) {
    const token = randomBytes(32).toString('base64url')
    this.sessions.set(token, session)
    return token
  }

  getSession(token) {
    return token ? (this.sessions.get(token) ?? null) : null
  }

  deleteSession(token) {
    this.sessions.delete(token)
  }

  // 6 cijfers, en opnieuw proberen als de code al in gebruik is.
  #newCode() {
    let code
    do {
      code = String(randomInt(100000, 1000000))
    } while (this.games.has(code))
    return code
  }
}

// Eén gedeelde instantie voor de hele server (REST-routes én socket-handlers).
export const gameManager = new GameManager()
