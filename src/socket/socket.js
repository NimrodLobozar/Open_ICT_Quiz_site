import { io } from 'socket.io-client'

// Eén socket voor de hele app. Elke pagina gebruikt dezelfde verbinding.
// Geen URL: verbinden met dezelfde host als de pagina, de Vite-proxy stuurt /socket.io door naar de backend.
// Daardoor werkt het ook op een telefoon via het LAN-IP.
// autoConnect: false, omdat we eerst moeten weten bij welke game en met welke rol iemand verbindt.
export const socket = io({ autoConnect: false })

/** Verbinden als host of speler van een game. De cookie gaat automatisch mee met de handshake. */
export function connectSocket(code, role) {
  // auth wordt bij elke (her)verbinding meegestuurd; de server leest het in socket.handshake.auth.
  socket.auth = { code, role }
  socket.connect()
}

/**
 * socket.emit met een ack, als Promise. Zo kun je `await emitWithAck(...)` schrijven.
 * timeout: zonder antwoord binnen 5 seconden krijg je een fout in plaats van eeuwig wachten.
 */
export async function emitWithAck(event, payload = {}) {
  return socket.timeout(5000).emitWithAck(event, payload)
}
