// Draait bij ELKE nieuwe socket-verbinding (de "handshake"), vóór de connection-handler.
// Leest de sessiecookie, zoekt de sessie op en koppelt de socket aan de juiste game + rol.
// Zo zijn er geen aparte socket-events nodig voor joinen of rejoinen (zie projectplan 6.1).
//
// De client geeft bij het verbinden mee welke game en rol hij bedoelt:
//   io({ auth: { gameCode: '482913', role: 'player' } })
// Dat is nodig omdat één browser zowel een host- als een speler-cookie kan hebben.
import { NO_SESSION } from '../constants/errors.js'
import { config } from '../config.js'
import { HOST_COOKIE, PLAYER_COOKIE, readSessionFromHeader } from '../utils/cookies.js'
import { rooms } from './broadcast.js'

function rejectWith(next, error, message) {
  const err = new Error(message)
  err.data = { error, message } // komt bij de client binnen als err.data in 'connect_error'
  next(err)
}

export function sessionMiddleware(socket, next) {
  const { gameCode, role } = socket.handshake.auth ?? {}

  // Zonder gamecode: alleen toegestaan in development, voor de /dev/socket-testpagina.
  if (!gameCode) {
    if (config.isProduction) return rejectWith(next, NO_SESSION, 'Geen sessie.')
    socket.data = { gameCode: null, playerId: null, role: 'guest' }
    return next()
  }

  const cookieName = role === 'host' ? HOST_COOKIE : PLAYER_COOKIE
  const session = readSessionFromHeader(socket.request.headers.cookie, cookieName)
  if (!session || session.gameCode !== String(gameCode)) {
    return rejectWith(next, NO_SESSION, 'Je zit (nog) niet in deze game.')
  }

  socket.data = { gameCode: session.gameCode, playerId: session.playerId, role: session.role }

  // Rooms joinen (zie projectplan 8.4).
  socket.join(rooms.game(session.gameCode))
  if (session.role === 'host') {
    socket.join(rooms.host(session.gameCode))
  } else {
    socket.join(rooms.player(session.gameCode, session.playerId))
  }
  next()
}
