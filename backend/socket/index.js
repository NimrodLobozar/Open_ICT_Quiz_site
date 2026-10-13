import { gameManager } from '../game/GameManager.js'
import { sendLobbyUpdate } from './broadcast.js'
import { EVENTS } from './events.js'
import { registerHostHandlers } from './hostHandlers.js'
import { gameRoom, hostRoom, playerRoom } from './rooms.js'
import { sessionMiddleware } from './sessionMiddleware.js'
import { buildSyncState } from './syncState.js'

export function registerSocketHandlers(io) {
  // Middleware: eerst kijken wie je bent. Zonder geldige sessie komt er geen 'connection'.
  io.use(sessionMiddleware)

  // Dit draait voor elke nieuwe verbinding (ook na verversen of een reconnect: dat is een nieuwe socket).
  io.on('connection', (socket) => {
    const { code, role, playerId } = socket.data
    const game = gameManager.getGame(code)

    // Rooms bepalen wie welke broadcasts krijgt.
    socket.join(gameRoom(code))
    if (role === 'host') {
      socket.join(hostRoom(code))
      registerHostHandlers(io, socket, game)
    } else {
      socket.join(playerRoom(code, playerId))
      game.setConnected(playerId, true)
      sendLobbyUpdate(io, game)
    }

    // Na (her)verbinden vraagt de client de huidige toestand op. Het antwoord gaat via de ack-callback:
    // dat is een antwoord op precies deze vraag, alleen voor deze client.
    socket.on(EVENTS.GAME_SYNC, (_payload, ack) => {
      ack?.({ ok: true, state: buildSyncState(game, socket.data) })
    })

    socket.on('disconnect', () => {
      if (role !== 'player' || !game.getPlayer(playerId)) return
      // Nog een ander tabblad van dezelfde speler open? Dan is hij nog online.
      const stillOpen = io.sockets.adapter.rooms.get(playerRoom(code, playerId))?.size > 0
      if (!stillOpen) {
        game.setConnected(playerId, false)
        sendLobbyUpdate(io, game)
      }
    })
  })
}
