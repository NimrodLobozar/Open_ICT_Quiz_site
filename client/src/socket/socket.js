// Eén gedeelde Socket.IO-verbinding voor de hele app.
//
// autoConnect: false → we verbinden pas NA een geslaagde sessie-check (aanmaken, joinen of
// GET /api/games/:code/me). De server leest bij het verbinden de httpOnly-cookie uit;
// wij geven alleen mee welke game en rol we bedoelen.
import { io } from 'socket.io-client'

export const socket = io({ autoConnect: false })

/**
 * Verbind met een game.
 * @param {string} gameCode
 * @param {'host' | 'player'} role
 */
export function connectToGame(gameCode, role) {
  socket.auth = { gameCode, role }
  socket.connect()
}

/** Verbinding met een game verbreken (bijv. als je de pagina verlaat). */
export function disconnectFromGame() {
  socket.disconnect()
}

/**
 * Stuurt een event en wacht op het antwoord (ack) van de server.
 * @returns {Promise<{ ok: boolean, error?: string, message?: string }>}
 */
export function emitWithAck(event, payload = {}) {
  return socket
    .timeout(5000)
    .emitWithAck(event, payload)
    .catch(() => ({
      ok: false,
      error: 'TIMEOUT',
      message: 'De server reageert niet.',
    }))
}
