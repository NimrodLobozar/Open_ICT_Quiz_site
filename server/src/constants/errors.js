// Foutcodes die client en server allebei kennen (zie docs/SOCKET-EVENTS.md).
export const GAME_NOT_FOUND = 'GAME_NOT_FOUND'
export const LOBBY_LOCKED = 'LOBBY_LOCKED'
export const LOBBY_FULL = 'LOBBY_FULL'
export const NAME_TAKEN = 'NAME_TAKEN'
export const NAME_INVALID = 'NAME_INVALID'
export const ALREADY_ANSWERED = 'ALREADY_ANSWERED'
export const TOO_LATE = 'TOO_LATE'
export const NOT_HOST = 'NOT_HOST'
export const NO_SESSION = 'NO_SESSION'
export const WRONG_PHASE = 'WRONG_PHASE'
export const NOT_IMPLEMENTED = 'NOT_IMPLEMENTED'

/**
 * Een fout die we bewust gooien vanuit de game-logica.
 * Routes en socket-handlers vangen hem op en sturen `{ error, message }` terug.
 */
export class GameError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.code = code
    this.status = status // HTTP-status voor REST-routes
  }
}
