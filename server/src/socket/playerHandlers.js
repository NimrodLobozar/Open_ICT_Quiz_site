// Socket-events die alleen spelers sturen.
import * as events from '../constants/events.js'
import { GameError, WRONG_PHASE } from '../constants/errors.js'
import { gameManager } from '../game/GameManager.js'
import { withAck } from './withAck.js'

export function registerPlayerHandlers(io, socket) {
  // player:answer { questionIndex, optionId } → antwoord ontvangen.
  // De speler hoort hier NIET of het goed is; dat komt pas bij `player:result`.
  socket.on(
    events.PLAYER_ANSWER,
    withAck(({ questionIndex, optionId }) => {
      if (socket.data.role !== 'player') {
        throw new GameError(WRONG_PHASE, 'Alleen spelers kunnen antwoorden.')
      }
      const game = gameManager.getGame(socket.data.gameCode)
      game.submitAnswer(socket.data.playerId, Number(questionIndex), Number(optionId))
      // TODO(team, Fase 4): stuur `question:progress` naar de host (io.to(rooms.host(code))).
      // Heeft iedereen geantwoord? Laat de vraag dan meteen eindigen.
    }),
  )
}
