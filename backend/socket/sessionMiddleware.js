import { gameManager } from '../game/GameManager.js'
import { HOST_COOKIE, PLAYER_COOKIE, readCookies } from '../utils/cookies.js'

/**
 * Draait één keer per verbinding, vóórdat 'connection' afgaat (ook bij elke automatische reconnect).
 * Hier bepalen we WIE deze socket is. Dat doen we met de httpOnly-cookie, niet met iets dat de client zelf stuurt:
 * een client kan in DevTools alles in socket.auth zetten, maar de cookie-token kan hij niet raden.
 *
 * De client stuurt alleen mee welke game en welke rol hij wil (socket.auth = { code, role }),
 * zodat host en speler in dezelfde browser allebei kunnen werken (twee verschillende cookies).
 */
export function sessionMiddleware(socket, next) {
  const { code, role } = socket.handshake.auth ?? {}
  const cookies = readCookies(socket.request.headers.cookie)
  const token = role === 'host' ? cookies[HOST_COOKIE] : cookies[PLAYER_COOKIE]
  const session = gameManager.getSession(token)

  // De sessie moet bestaan én bij deze game horen.
  const game = session && session.code === code ? gameManager.getGame(code) : null
  if (!game || session.role !== role) return next(new Error('NO_SESSION'))
  if (role === 'player' && !game.getPlayer(session.playerId)) return next(new Error('NO_SESSION'))

  // socket.data blijft bij deze socket zolang hij verbonden is. Handlers lezen hier de identiteit uit.
  socket.data = { code, role, playerId: session.playerId ?? null, token }
  next()
}
