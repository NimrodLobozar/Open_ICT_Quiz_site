// Socket-events die alleen de host mag sturen.
import * as events from '../constants/events.js'
import { GameError, NOT_HOST, NOT_IMPLEMENTED } from '../constants/errors.js'
import { gameManager } from '../game/GameManager.js'
import { closeGame, emitLobbyUpdate } from './broadcast.js'
import { withAck } from './withAck.js'

export function registerHostHandlers(io, socket) {
  // Haalt de game op en controleert dat deze socket echt de host is.
  function getHostGame() {
    if (socket.data.role !== 'host') throw new GameError(NOT_HOST, 'Alleen de host mag dit.')
    return gameManager.getGame(socket.data.gameCode)
  }

  // host:lock { locked } → lobby op slot (geen nieuwe spelers, rejoin blijft werken)
  socket.on(
    events.HOST_LOCK,
    withAck(({ locked }) => {
      const game = getHostGame()
      game.lock(locked)
      emitLobbyUpdate(io, game)
    }),
  )

  // host:kick { playerId } → (optioneel, nice-to-have)
  socket.on(
    events.HOST_KICK,
    withAck(() => {
      getHostGame()
      // TODO(team, Fase 3): speler verwijderen met game.removePlayer(playerId), zijn sessietoken
      // ongeldig maken in gameManager.sessions, disconnectPlayer() uit broadcast.js aanroepen
      // en emitLobbyUpdate() sturen. Stuur de speler eerst `game:closed` met reason 'kicked'.
      throw new GameError(NOT_IMPLEMENTED, 'Kicken is nog niet gebouwd.')
    }),
  )

  // host:start → quiz begint
  socket.on(
    events.HOST_START,
    withAck(() => {
      const game = getHostGame()
      game.start()
      // TODO(team, Fase 4): stuur `game:phase` + `question:show` (ZONDER isCorrect) naar de room,
      // start de timer met setTimeout. Is de tijd op (of heeft iedereen geantwoord)?
      // → game.nextPhase(), `question:end` naar iedereen en `player:result` naar elke speler
      //   (via rooms.player(code, playerId) uit broadcast.js).
    }),
  )

  // host:next → volgende fase / vraag
  socket.on(
    events.HOST_NEXT,
    withAck(() => {
      const game = getHostGame()
      game.nextPhase()
      // TODO(team, Fase 4/5): stuur het event dat bij de nieuwe fase hoort:
      // LEADERBOARD → `leaderboard:show`, QUESTION_PREVIEW → `question:show`, PODIUM → `game:podium`.
      // TODO(team, Fase 7): bij PODIUM de resultaten opslaan (GameSession + GameResult).
    }),
  )

  // host:restart → zelfde spelers, scores 0, terug naar de lobby
  socket.on(
    events.HOST_RESTART,
    withAck(() => {
      const game = getHostGame()
      game.restart()
      // TODO(team, Fase 6): stuur `game:restarted` en daarna emitLobbyUpdate(io, game).
    }),
  )

  // host:end → lobby sluiten, iedereen eruit
  socket.on(
    events.HOST_END,
    withAck(() => {
      const game = getHostGame()
      gameManager.removeGame(game.code)
      // Eerst stuurt withAck het antwoord terug, daarna verbreken we alle verbindingen.
      setImmediate(() => closeGame(io, game.code, 'De host heeft de game afgesloten.'))
    }),
  )
}
