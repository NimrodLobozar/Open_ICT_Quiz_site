// De state machine van één game (zie docs/PROJECTPLAN.md hoofdstuk 8.3).
//
// Een Game weet NIETS van Socket.IO of Express: hij houdt alleen de toestand bij en
// gooit een GameError als iets niet mag. De socket-handlers en routes roepen deze
// methodes aan en sturen daarna de juiste events rond. Zo kun je alles los testen.
//
// Status:
// - KLAAR (voorbeeld voor het team): addPlayer, removePlayer, hasPlayer, setPlayerConnected,
//   setHostConnected, lock, getLobbyState, getPublicInfo.
// - STUB, bouwt het team: start, submitAnswer, nextPhase, restart, getRanking, getStateFor.
import { randomUUID } from 'node:crypto'
import {
  GameError,
  GAME_NOT_FOUND,
  LOBBY_FULL,
  LOBBY_LOCKED,
  NAME_TAKEN,
  NOT_IMPLEMENTED,
} from '../constants/errors.js'
import { checkName } from './nameRules.js'
import { LOBBY } from './phases.js'
import { normalizeSettings } from './settings.js'

/**
 * @typedef {object} Player
 * @property {string} id
 * @property {string} nickname
 * @property {number} score
 * @property {boolean} connected
 * @property {number} connections aantal open sockets (meerdere tabs van dezelfde speler)
 * @property {boolean} isVerified true voor account-spelers (later, L1)
 * @property {string[]} roles beroepsrollen (later, L2)
 * @property {Map<number, object>} answers questionIndex → antwoord (vul je in bij submitAnswer)
 */

export class Game {
  /**
   * @param {object} params
   * @param {string} params.code joincode van 6 cijfers
   * @param {object} params.quiz quiz uit de database, inclusief questions + options (MET isCorrect!)
   * @param {object} [params.settings] zie settings.js
   */
  constructor({ code, quiz, settings }) {
    this.code = code
    this.quiz = quiz // Bevat de juiste antwoorden: stuur dit NOOIT zomaar naar clients.
    this.settings = normalizeSettings(settings)
    this.phase = LOBBY
    this.locked = false
    this.round = 1
    this.currentQuestionIndex = -1
    /** @type {Map<string, Player>} */
    this.players = new Map()
    this.hostConnected = false
    this.hostConnections = 0 // de host kan meerdere tabs open hebben
    this.hostLastSeenAt = Date.now() // gebruikt door GameManager om verlaten games op te ruimen
    this.createdAt = Date.now()
  }

  // ---------------------------------------------------------------- spelers (KLAAR)

  /**
   * Voegt een nieuwe speler toe. Rejoinen gaat NIET via deze methode maar via de sessiecookie.
   * @param {string} rawNickname
   * @returns {Player}
   * @throws {GameError} LOBBY_LOCKED, LOBBY_FULL, NAME_INVALID of NAME_TAKEN
   */
  addPlayer(rawNickname) {
    if (this.locked) {
      throw new GameError(LOBBY_LOCKED, 'Deze lobby is gesloten.', 403)
    }
    if (this.players.size >= this.settings.maxPlayers) {
      throw new GameError(LOBBY_FULL, 'Deze lobby zit vol.', 403)
    }
    const existingNames = [...this.players.values()].map((p) => p.nickname)
    const result = checkName(rawNickname, existingNames)
    if (!result.ok) {
      const status = result.error === NAME_TAKEN ? 409 : 400
      throw new GameError(result.error, result.message, status)
    }

    // TODO(team, Fase 4): mag je joinen terwijl de quiz al bezig is? Zo ja, met score 0.

    /** @type {Player} */
    const player = {
      id: randomUUID(),
      nickname: result.name,
      score: 0,
      connected: false, // wordt true zodra de socket verbindt
      connections: 0,
      isVerified: false,
      roles: [],
      answers: new Map(),
    }
    this.players.set(player.id, player)
    return player
  }

  /** Speler verlaat de lobby zelf ("Opnieuw spelen"). Zijn naam komt daarmee vrij. */
  removePlayer(playerId) {
    return this.players.delete(playerId)
  }

  hasPlayer(playerId) {
    return this.players.has(playerId)
  }

  getPlayer(playerId) {
    const player = this.players.get(playerId)
    if (!player) throw new GameError(GAME_NOT_FOUND, 'Speler niet gevonden.', 404)
    return player
  }

  /**
   * Houdt bij of een speler online is. Een speler kan meerdere tabs open hebben,
   * dus we tellen het aantal verbindingen.
   * @param {string} playerId
   * @param {boolean} connected
   */
  setPlayerConnected(playerId, connected) {
    const player = this.players.get(playerId)
    if (!player) return
    player.connections = Math.max(0, player.connections + (connected ? 1 : -1))
    player.connected = player.connections > 0
  }

  setHostConnected(connected) {
    this.hostConnections = Math.max(0, this.hostConnections + (connected ? 1 : -1))
    this.hostConnected = this.hostConnections > 0
    this.hostLastSeenAt = Date.now()
  }

  /**
   * Lobby op slot: geen NIEUWE spelers meer. Rejoinen via de cookie blijft wel werken.
   * @param {boolean} locked
   */
  lock(locked) {
    this.locked = Boolean(locked)
  }

  // ---------------------------------------------------------------- toestand naar clients (KLAAR)

  /** Payload voor het event `lobby:update`. */
  getLobbyState() {
    const players = [...this.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      connected: p.connected,
      isVerified: p.isVerified,
      roles: p.roles,
    }))
    return { players, locked: this.locked, playerCount: players.length }
  }

  /** Voor `GET /api/games/:code` (het joinformulier). Geen geheime info. */
  getPublicInfo() {
    return { exists: true, locked: this.locked, phase: this.phase, quizTitle: this.quiz.title }
  }

  // ---------------------------------------------------------------- game loop (STUBS, team)

  /**
   * TODO(team, Fase 4): start de quiz.
   * - Alleen in fase LOBBY en met minstens 1 speler (anders WRONG_PHASE / foutmelding).
   * - Zet currentQuestionIndex op 0 en ga naar QUESTION_PREVIEW
   *   (of meteen QUESTION_ACTIVE als settings.questionPreviewSeconds === 0).
   * - Bewaar het moment waarop de vraag ACTIEF wordt (voor de responstijd in scoring.js).
   * - De socket-handler start daarna de timer (setTimeout) en stuurt `question:show`.
   */
  start() {
    throw new GameError(NOT_IMPLEMENTED, 'start() is nog niet gebouwd (Fase 4).', 501)
  }

  /**
   * TODO(team, Fase 4): verwerk een antwoord.
   * - Alleen in fase QUESTION_ACTIVE en voor de huidige vraag (anders WRONG_PHASE / TOO_LATE).
   * - Eén keer per vraag (anders ALREADY_ANSWERED).
   * - Bereken responstijd op de SERVER en punten met calculatePoints() uit scoring.js.
   * - Geef terug of iedereen heeft geantwoord, zodat de vraag eerder kan eindigen.
   * - Vertel de speler hier NIET of het goed was; dat komt pas bij `player:result`.
   * @param {string} playerId
   * @param {number} questionIndex
   * @param {number} optionId
   * @returns {{ allAnswered: boolean, answeredCount: number, playerCount: number }}
   */
  // eslint-disable-next-line no-unused-vars
  submitAnswer(playerId, questionIndex, optionId) {
    throw new GameError(NOT_IMPLEMENTED, 'submitAnswer() is nog niet gebouwd (Fase 4).', 501)
  }

  /**
   * TODO(team, Fase 4/5): ga naar de volgende fase (zie het diagram in hoofdstuk 8.3).
   * QUESTION_PREVIEW → QUESTION_ACTIVE → QUESTION_RESULT → LEADERBOARD →
   * volgende vraag (QUESTION_PREVIEW) of, na de laatste vraag, PODIUM.
   * Wordt aangeroepen door de timer én door `host:next`.
   * @returns {string} de nieuwe fase
   */
  nextPhase() {
    throw new GameError(NOT_IMPLEMENTED, 'nextPhase() is nog niet gebouwd (Fase 4).', 501)
  }

  /**
   * TODO(team, Fase 6): herstart de quiz met dezelfde spelers.
   * - Scores en antwoorden naar 0 / leeg, fase terug naar LOBBY, round + 1.
   * - Spelers blijven in de lobby (ze hoeven niet opnieuw te joinen).
   * - (Later, L3) moeilijkheid aanpassen op basis van de vorige ronde.
   */
  restart() {
    throw new GameError(NOT_IMPLEMENTED, 'restart() is nog niet gebouwd (Fase 6).', 501)
  }

  /**
   * TODO(team, Fase 5): ranglijst van alle spelers, hoog → laag.
   * Tip: gebruik rankPlayers() uit scoring.js (gelijke score = zelfde plek).
   * @returns {{ rank: number, playerId: string, nickname: string, score: number, isVerified: boolean }[]}
   */
  getRanking() {
    throw new GameError(NOT_IMPLEMENTED, 'getRanking() is nog niet gebouwd (Fase 5).', 501)
  }

  /**
   * Toestand voor `game:sync` (na (her)verbinden). Nu alleen lobby + fase.
   * TODO(team, Fase 4/5): voeg de huidige vraag (ZONDER isCorrect), resterende tijd,
   * en voor spelers hun eigen score/antwoord toe, zodat een rejoin midden in een vraag werkt.
   * @param {'host' | 'player'} role
   * @param {string | null} playerId
   */
  getStateFor(role, playerId) {
    const state = {
      code: this.code,
      quizTitle: this.quiz.title,
      phase: this.phase,
      questionIndex: this.currentQuestionIndex,
      totalQuestions: this.quiz.questions.length,
      settings: this.settings,
      lobby: this.getLobbyState(),
    }
    if (role === 'player' && playerId) {
      const player = this.players.get(playerId)
      state.me = player ? { id: player.id, nickname: player.nickname, score: player.score } : null
    }
    return state
  }
}
