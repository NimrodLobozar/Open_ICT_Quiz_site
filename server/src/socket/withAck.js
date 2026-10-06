// Verpakt een socket-handler zodat de client ALTIJD een antwoord (ack) krijgt:
//   gelukt → { ok: true, ...resultaat }
//   fout   → { ok: false, error: 'CODE', message: '...' }
// Gooi in je handler gewoon een GameError; deze helper vangt hem op.
import { GameError } from '../constants/errors.js'

export function withAck(handler) {
  return async (payload, ack) => {
    // socket.emit('event', callback) zonder payload → het eerste argument is de callback
    if (typeof payload === 'function') {
      ack = payload
      payload = {}
    }
    const reply = typeof ack === 'function' ? ack : () => {}

    try {
      const result = await handler(payload ?? {})
      reply({ ok: true, ...result })
    } catch (error) {
      if (error instanceof GameError) {
        reply({ ok: false, error: error.code, message: error.message })
      } else {
        console.error('Fout in socket-handler:', error)
        reply({ ok: false, error: 'INTERNAL', message: 'Er ging iets mis op de server.' })
      }
    }
  }
}
