// Beheert alle ACTIEVE games in het geheugen van de server, plus de sessies (cookies).
//
// - games:    Map<gamecode, Game>
// - sessions: Map<token, { gameCode, playerId, role }>
//
// Herstart de server, dan is alles weg. Dat is acceptabel voor de MVP.
// In de cookie staat ALLEEN de token; wie je bent zoeken we hier op (zie projectplan 6.1).
import { randomBytes } from 'node:crypto'
import { GameError, GAME_NOT_FOUND } from '../constants/errors.js'
import { generateCode } from './codeGenerator.js'
import { Game } from './Game.js'

export const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000 // 4 uur, gelijk aan de cookie
const HOST_GONE_TIMEOUT_MS = 10 * 60 * 1000 // game zonder host-verbinding → na 10 min weg
const CLEANUP_INTERVAL_MS = 60 * 1000

/** Een willekeurige, onraadbare sessietoken. */
function createToken() {
  return randomBytes(32).toString('base64url')
}

export class GameManager {
  constructor() {
    /** @type {Map<string, Game>} */
    this.games = new Map()
    /** @type {Map<string, { gameCode: string, playerId: string | null, role: 'host' | 'player', createdAt: number }>} */
    this.sessions = new Map()
    this.cleanupTimer = null
  }

  // ---------------------------------------------------------------- games

  /**
   * Maakt een nieuwe game + host-sessie.
   * @param {object} quiz quiz uit de database (met vragen en opties)
   * @param {object} settings
   * @returns {{ game: Game, hostToken: string }}
   */
  createGame(quiz, settings) {
    const code = generateCode((c) => this.games.has(c))
    const game = new Game({ code, quiz, settings })
    this.games.set(code, game)
    const hostToken = this.createSession({ gameCode: code, playerId: null, role: 'host' })
    return { game, hostToken }
  }

  /** @returns {Game | undefined} */
  findGame(code) {
    return this.games.get(String(code))
  }

  /**
   * Zelfde als findGame, maar gooit een 404-fout als de game niet bestaat.
   * @returns {Game}
   */
  getGame(code) {
    const game = this.findGame(code)
    if (!game) throw new GameError(GAME_NOT_FOUND, 'Deze code bestaat niet.', 404)
    return game
  }

  /**
   * Speler joint met een naam. Gooit een GameError als de naam/lobby niet goed is.
   * @returns {{ player: import('./Game.js').Player, token: string }}
   */
  joinGame(code, nickname) {
    const game = this.getGame(code)
    const player = game.addPlayer(nickname)
    const token = this.createSession({ gameCode: game.code, playerId: player.id, role: 'player' })
    return { player, token }
  }

  /** Speler verlaat de game zelf: speler weg, token ongeldig, naam komt vrij. */
  leaveGame(token) {
    const session = this.sessions.get(token)
    if (!session || session.role !== 'player') return null
    this.sessions.delete(token)
    this.findGame(session.gameCode)?.removePlayer(session.playerId)
    return session
  }

  /** Game opruimen (host sluit af, of host is te lang weg). Alle tokens worden ongeldig. */
  removeGame(code) {
    this.games.delete(code)
    for (const [token, session] of this.sessions) {
      if (session.gameCode === code) this.sessions.delete(token)
    }
  }

  // ---------------------------------------------------------------- sessies

  createSession({ gameCode, playerId, role }) {
    const token = createToken()
    this.sessions.set(token, { gameCode, playerId, role, createdAt: Date.now() })
    return token
  }

  /**
   * Zoekt de sessie bij een token. Geeft null als de token onbekend/verlopen is,
   * of als de game of speler niet meer bestaat.
   */
  getSession(token) {
    if (!token) return null
    const session = this.sessions.get(token)
    if (!session) return null

    const expired = Date.now() - session.createdAt > SESSION_MAX_AGE_MS
    const game = this.findGame(session.gameCode)
    const playerGone = session.role === 'player' && !game?.hasPlayer(session.playerId)
    if (expired || !game || playerGone) {
      this.sessions.delete(token)
      return null
    }
    return session
  }

  // ---------------------------------------------------------------- opruimen

  /** Ruimt games op waarvan de host al 10 minuten weg is. Geeft de verwijderde codes terug. */
  cleanup(now = Date.now()) {
    const removed = []
    for (const game of this.games.values()) {
      const hostGone = !game.hostConnected && now - game.hostLastSeenAt > HOST_GONE_TIMEOUT_MS
      if (hostGone) {
        this.removeGame(game.code)
        removed.push(game.code)
      }
    }
    return removed
  }

  /**
   * Start de opruim-timer.
   * @param {(code: string) => void} [onRemoved] bijv. om `game:closed` te sturen
   */
  startCleanup(onRemoved = () => {}) {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().forEach(onRemoved)
    }, CLEANUP_INTERVAL_MS)
    this.cleanupTimer.unref() // houdt het proces niet in leven (handig in tests)
  }
}

// Eén gedeelde instantie voor de hele server.
export const gameManager = new GameManager()
