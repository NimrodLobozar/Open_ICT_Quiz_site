// Kleine helpers om events naar de juiste mensen te sturen.
import { GAME_CLOSED, LOBBY_UPDATE } from '../constants/events.js'

/** Room-namen (zie projectplan 8.4). */
export const rooms = {
  game: (code) => code, // host + alle spelers
  host: (code) => `${code}:host`, // alleen de host
  player: (code, playerId) => `${code}:player:${playerId}`, // één speler (al zijn tabs)
}

/** Stuurt de actuele spelerslijst naar iedereen in de game. */
export function emitLobbyUpdate(io, game) {
  io.to(rooms.game(game.code)).emit(LOBBY_UPDATE, game.getLobbyState())
}

/** Laat alle sockets van één speler de game verlaten (bijv. na "Opnieuw spelen"). */
export function disconnectPlayer(io, code, playerId) {
  io.in(rooms.player(code, playerId)).disconnectSockets(true)
}

/** Vertelt iedereen dat de game weg is en verbreekt alle verbindingen. */
export function closeGame(io, code, reason) {
  io.to(rooms.game(code)).emit(GAME_CLOSED, { reason })
  io.in(rooms.game(code)).disconnectSockets(true)
}
