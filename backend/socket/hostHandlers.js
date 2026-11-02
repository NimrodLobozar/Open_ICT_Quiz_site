import { saveGameResultsInBackground } from "../db/gameResults.js";
import { addBots, simulateAnswers } from "../game/devSimulation.js";
import { GameError } from "../game/GameError.js";
import { PHASES } from "../game/phases.js";
import { sendLobbyUpdate, sendPodium } from "./broadcast.js";
import { EVENTS } from "./events.js";
import { afterPhaseChange } from "./gameLoop.js";
import { gameRoom, playerRoom } from "./rooms.js";

// Events die alleen de host mag sturen. Deze functie wordt alleen aangeroepen voor host-sockets
// (zie socket/index.js), dus een speler die 'dev:finish' stuurt, wordt nergens gehoord.
export function registerHostHandlers(io, socket, game) {
  // ALLEEN DEVELOPMENT: speelt de quiz nep af en toont meteen het podium, met tot 100 testspelers.
  // Handig om het eindscherm te testen zonder 8 vragen te spelen. De echte weg is host:start + host:next.
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
        // Na het podium, zodat de spelers niet op de database wachten.
        // Straks moet host:next na de laatste vraag dit ook doen.
        saveGameResultsInBackground(game);
        ack?.({ ok: true });
      } catch (error) {
        ack?.(toErrorResponse(error));
      }
    });
  }

  // Quiz starten: de lobby gaat dicht (Game.addPlayer weigert nu nieuwe spelers) en vraag 1 verschijnt.
  socket.on(EVENTS.HOST_START, (_payload, ack) => {
    try {
      game.start();
      afterPhaseChange(io, game);
      ack?.({ ok: true });
    } catch (error) {
      ack?.(toErrorResponse(error));
    }
  });

  // Eén knop voor de host, met per fase een andere betekenis (zie Game.next):
  // "Antwoorden nu tonen", "Tijd stoppen" en "Volgende vraag" / "Naar de eindstand".
  // De client stuurt mee op welk scherm hij klikte. Klikt de host twee keer op "Volgende vraag",
  // of gaat de timer net af tijdens de klik, dan hoort die klik bij een scherm dat al voorbij is:
  // zonder deze check zou de tweede klik meteen de leestijd van de volgende vraag overslaan.
  socket.on(EVENTS.HOST_NEXT, ({ phase, questionIndex } = {}, ack) => {
    try {
      if (phase !== game.phase || questionIndex !== game.questionIndex)
        throw new GameError("WRONG_PHASE", "Dit scherm is al voorbij.");
      game.next();
      afterPhaseChange(io, game);
      ack?.({ ok: true });
    } catch (error) {
      ack?.(toErrorResponse(error));
    }
  });

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

  socket.on(EVENTS.HOST_KICK_PLAYER, ({ playerId } = {}, ack) => {
    try {
      game.kickPlayer(playerId);
      // Open sockets van de speler verbreken, net als bij zelf vertrekken (routes/games.js).
      // Bij een nieuwe verbinding weigert de sessionMiddleware hem, want de speler bestaat niet meer.
      io.in(playerRoom(game.code, playerId)).disconnectSockets(true);
      sendLobbyUpdate(io, game);
      ack?.({ ok: true });
    } catch (error) {
      ack?.(toErrorResponse(error));
    }
  });

  // Lobby op slot of open. Het joinen zelf gaat via REST (POST /players); daar weigert
  // Game.addPlayer dan met LOBBY_LOCKED. lobby:update vertelt iedereen de nieuwe stand,
  // ook een tweede tabblad van de host.
  socket.on(EVENTS.HOST_LOCK, ({ locked } = {}, ack) => {
    try {
      game.setLocked(locked);
      sendLobbyUpdate(io, game);
      ack?.({ ok: true, locked: game.locked });
    } catch (error) {
      ack?.(toErrorResponse(error));
    }
  });

  socket.on(EVENTS.HOST_SET_QUESTION_COUNT, ({ count } = {}, ack) => {
    try {
      game.setQuestionCount(count);
      sendLobbyUpdate(io, game);
      ack?.({ ok: true, questionCount: game.questionCount });
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
