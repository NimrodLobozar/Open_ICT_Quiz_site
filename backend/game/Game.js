import { getRanking } from '../../src/utils/ranking.js'
import { GameError } from './GameError.js'
import { nameKey, normalizeName, validateName } from './nameRules.js'
import { PHASES } from './phases.js'
import { buildPlayerResult } from '../../src/utils/playerResult.js'

// Eén lopende game, in het geheugen van de server (projectplan 6).
// Deze klasse weet niets van Socket.IO of Express: ze houdt alleen de toestand bij.
// Zo kun je haar testen zonder server, en kunnen REST en sockets dezelfde regels gebruiken.
export class Game {
  constructor(code, { totalQuestions = 8 } = {}) {
    this.code = code
    this.phase = PHASES.LOBBY
    this.locked = false
    this.totalQuestions = totalQuestions
    /** @type {Map<number, Player>} */
    this.players = new Map()
    this.nextPlayerId = 1
    // De eindstand wordt één keer vastgezet bij het podium.
    // Verlaat iemand daarna het spel, dan blijft de eindstand van de rest gelijk.
    this.finalRanking = null
  }

  /** Nieuwe speler in de lobby. Gooit een GameError als het niet mag. */
  addPlayer(rawNickname, { isBot = false } = {}) {
    if (this.phase !== PHASES.LOBBY) throw new GameError('WRONG_PHASE', 'De quiz is al begonnen.', 403)
    if (this.locked) throw new GameError('LOBBY_LOCKED', 'Deze lobby is gesloten.', 403)

    const nickname = normalizeName(rawNickname)
    const invalid = validateName(nickname)
    if (invalid) throw new GameError(invalid, 'Gebruik 2 tot 20 letters, cijfers, spaties, - _ of .', 400)

    const key = nameKey(nickname)
    if ([...this.players.values()].some((player) => nameKey(player.nickname) === key)) {
      throw new GameError('NAME_TAKEN', 'Deze naam is al bezet. Kies een andere naam.', 409)
    }

    const player = {
      id: this.nextPlayerId++,
      nickname,
      score: 0,
      correctCount: 0,
      // Punten per vraag. De totaalscore is altijd de som hiervan, zo kun je het narekenen.
      answers: [],
      connected: false,
      isVerified: false, // pas true met een account (L1)
      isBot,
    }
    this.players.set(player.id, player)
    return player
  }

  getPlayer(playerId) {
    return this.players.get(playerId) ?? null
  }

  /** Speler vertrekt zelf: zijn naam komt vrij (projectplan 5, regel 6). */
  removePlayer(playerId) {
    return this.players.delete(playerId)
  }

  setConnected(playerId, connected) {
    const player = this.getPlayer(playerId)
    if (player) player.connected = connected
  }

  /** Antwoord op één vraag verwerken. De punten zijn al door de server berekend. */
  recordAnswer(playerId, { questionIndex, correct, points }) {
    const player = this.getPlayer(playerId)
    if (!player) return
    player.answers.push({ questionIndex, correct, points })
    player.score += points
    if (correct) player.correctCount += 1
  }

  /** Spelers voor de lobbylijst, zonder scores of andere interne velden. */
  getLobbyPlayers() {
    return [...this.players.values()].map(({ id, nickname, connected, isVerified }) => ({
      id,
      nickname,
      connected,
      isVerified,
    }))
  }

  /** De huidige stand (tussenstand). Altijd via getRanking, net als podium en scoreboard. */
  getRanking() {
    return getRanking(
      [...this.players.values()].map(({ id, nickname, score, correctCount, isVerified }) => ({
        id,
        nickname,
        score,
        correctCount,
        isVerified,
      })),
    )
  }

  /** Na de laatste vraag: stand vastzetten en naar het podium. */
  finish() {
    if (this.phase === PHASES.PODIUM) throw new GameError('WRONG_PHASE', 'De quiz is al afgelopen.', 409)
    // De eindstand ís de laatste tussenstand: dezelfde functie op dezelfde scores.
    this.finalRanking = this.getRanking()
    this.phase = PHASES.PODIUM
  }

  /** Eindstand zoals de clients hem krijgen (zonder correctCount van anderen). */
  getPublicRanking() {
    return (this.finalRanking ?? []).map(({ id, nickname, score, rank, isVerified }) => ({
      id,
      nickname,
      score,
      rank,
      isVerified,
    }))
  }

  /** Eigen resultaat voor het eindscherm, of null als de speler niet in de eindstand staat. */
  getPlayerResult(playerId) {
    if (!this.finalRanking) return null
    return buildPlayerResult(this.finalRanking, playerId, this.totalQuestions)
  }

  /** Host herstart: zelfde spelers en namen, alle scores op 0, terug naar de lobby. */
  restart() {
    for (const player of this.players.values()) {
      player.score = 0
      player.correctCount = 0
      player.answers = []
    }
    this.finalRanking = null
    this.phase = PHASES.LOBBY
  }
}

/**
 * @typedef {{ id: number, nickname: string, score: number, correctCount: number,
 *   answers: Array<{ questionIndex: number, correct: boolean, points: number }>,
 *   connected: boolean, isVerified: boolean, isBot: boolean }} Player
 */
