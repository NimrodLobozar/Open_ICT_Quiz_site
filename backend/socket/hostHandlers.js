import { addBots, simulateAnswers } from "../game/devSimulation.js";
import { GameError } from "../game/GameError.js";
import { PHASES } from "../game/phases.js";
import { sendLobbyUpdate, sendPodium } from "./broadcast.js";
import { EVENTS } from "./events.js";
import { gameRoom } from "./rooms.js";

// Events die alleen de host mag sturen. Deze functie wordt alleen aangeroepen voor host-sockets
// (zie socket/index.js), dus een speler die 'dev:finish' stuurt, wordt nergens gehoord.
export function registerHostHandlers(io, socket, game) {
  // ALLEEN DEVELOPMENT: zolang er geen echte vragen zijn, speelt dit de quiz nep af en toont het podium.
  // Straks doet host:next dit na de laatste tussenstand (projectplan 8.3).
  if (process.env.NODE_ENV !== "production") {
    socket.on(EVENTS.DEV_FINISH, ({ bots = 0 } = {}, ack) => {
      try {
        if (game.phase !== PHASES.LOBBY)
          throw new GameError("WRONG_PHASE", "Kan alleen vanuit de lobby.");
        addBots(game, Math.min(Number(bots) || 0, 200));
        simulateAnswers(game);
        game.finish();
        sendLobbyUpdate(io, game);
        sendPodium(io, game);
        ack?.({ ok: true });
      } catch (error) {
        ack?.(toErrorResponse(error));
      }
    });
  }

  socket.on(EVENTS.HOST_RESTART, (_payload, ack) => {
    try {
      // 1. Mag het? Alleen na het podium.
      if (game.phase !== PHASES.PODIUM)
        throw new GameError(
          "WRONG_PHASE",
          "Kan alleen na het podium herstarten.",
        );
      // 2. game.restart()
      game.restart();
      // 3. Iedereen in de room laten weten: EVENTS.GAME_RESTARTED
      io.to(gameRoom(game.code)).emit(EVENTS.GAME_RESTARTED, {});
      // 4. De spelerslijst opnieuw sturen (sendLobbyUpdate)
      sendLobbyUpdate(io, game);
      // 5. ack({ ok: true })
      ack?.({ ok: true });
    } catch (error) {
      ack?.(toErrorResponse(error));
    }
  });
}

// Elke ack heeft dezelfde vorm: { ok: true, ... } of { ok: false, error, message } (projectplan 8).
export function toErrorResponse(error) {
  if (error instanceof GameError)
    return { ok: false, error: error.code, message: error.message };
  console.error(error);
  return {
    ok: false,
    error: "SERVER_ERROR",
    message: "Er ging iets mis op de server.",
  };
}
