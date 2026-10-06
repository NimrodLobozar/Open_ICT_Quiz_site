// Koppelt alle socket-handlers aan Socket.IO.
import * as events from '../constants/events.js'
import { gameManager } from '../game/GameManager.js'
import { closeGame, emitLobbyUpdate } from './broadcast.js'
import { registerHostHandlers } from './hostHandlers.js'
import { registerPlayerHandlers } from './playerHandlers.js'
import { sessionMiddleware } from './sessionMiddleware.js'
import { withAck } from './withAck.js'

export function setupSocket(io) {
  io.use(sessionMiddleware)

  io.on('connection', (socket) => {
    const { gameCode, playerId, role } = socket.data

    // Alleen voor /dev/socket: ping → pong met servertijd. Werkt ook zonder sessie.
    socket.on(
      events.DEV_PING,
      withAck(() => ({ message: 'pong', serverTime: new Date().toISOString() })),
    )

    if (role === 'guest') return // geen game gekoppeld, verder niets te doen

    // Online markeren + iedereen de nieuwe spelerslijst sturen.
    const game = gameManager.findGame(gameCode)
    if (role === 'host') game?.setHostConnected(true)
    else game?.setPlayerConnected(playerId, true)
    if (game) emitLobbyUpdate(io, game)

    // game:sync → huidige toestand opvragen na (her)verbinden
    socket.on(
      events.GAME_SYNC,
      withAck(() => ({ state: gameManager.getGame(gameCode).getStateFor(role, playerId) })),
    )

    if (role === 'host') registerHostHandlers(io, socket)
    else registerPlayerHandlers(io, socket)

    socket.on('disconnect', () => {
      const current = gameManager.findGame(gameCode)
      if (!current) return // game is al opgeruimd
      if (role === 'host') current.setHostConnected(false)
      else current.setPlayerConnected(playerId, false)
      emitLobbyUpdate(io, current)
    })
  })

  // Games waarvan de host te lang weg is, worden opgeruimd: spelers krijgen een melding.
  gameManager.startCleanup((code) => closeGame(io, code, 'De host is te lang weg geweest.'))
}
