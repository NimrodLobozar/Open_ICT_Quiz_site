import { EVENTS } from './events.js'
import { afterAnswer } from './gameLoop.js'
import { toErrorResponse } from './hostHandlers.js'

// Events die alleen een speler mag sturen. Alleen aangeroepen voor speler-sockets (zie socket/index.js).
export function registerPlayerHandlers(io, socket, game) {
  // De speler stuurt alleen "ik kies optie X". Goed of fout hoort hij pas bij question:end,
  // anders kan hij in DevTools het antwoord van de ack aflezen en de rest voorzeggen.
  socket.on(EVENTS.PLAYER_ANSWER, ({ questionIndex, optionId } = {}, ack) => {
    try {
      game.submitAnswer(socket.data.playerId, { questionIndex, optionId })
      ack?.({ ok: true })
      afterAnswer(io, game)
    } catch (error) {
      ack?.(toErrorResponse(error))
    }
  })
}
