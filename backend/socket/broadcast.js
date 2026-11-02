import { EVENTS } from "./events.js";
import { gameRoom, hostRoom, playerRoom } from "./rooms.js";

// Berichten die de server uit zichzelf naar clients stuurt.
// Los van de handlers, omdat zowel REST-routes als socket-handlers ze gebruiken.

/** Nieuwe spelerslijst naar iedereen in de game. */
export function sendLobbyUpdate(io, game) {
  const players = game.getLobbyPlayers();
  io.to(gameRoom(game.code)).emit(EVENTS.LOBBY_UPDATE, {
    players,
    playerCount: players.length,
    locked: game.locked,
    questionCount: game.questionCount,
    skillAverages: game.getSkillAverage(),
  });
}

/** De huidige vraag naar iedereen (zonder het goede antwoord, zie Game.getQuestionPayload). */
export function sendQuestion(io, game) {
  io.to(gameRoom(game.code)).emit(
    EVENTS.QUESTION_SHOW,
    game.getQuestionPayload(),
  );
}

/** "9/12 antwoorden": alleen naar de host. Spelers hoeven niet te zien hoe snel de rest is. */
export function getProgressPayload(game) {
  return {
    answeredCount: game.getAnsweredCount(),
    playerCount: game.players.size,
  };
}

export function sendProgress(io, game) {
  io.to(hostRoom(game.code)).emit(
    EVENTS.QUESTION_PROGRESS,
    getProgressPayload(game),
  );
}

/**
 * Vraag voorbij: eerst voor iedereen het goede antwoord en de tussenstand,
 * daarna ieder zijn eigen uitslag via zijn eigen room (net als bij het podium).
 */
export function sendQuestionEnd(io, game) {
  io.to(gameRoom(game.code)).emit(
    EVENTS.QUESTION_END,
    game.getQuestionEndPayload(),
  );
  for (const id of game.players.keys()) {
    io.to(playerRoom(game.code, id)).emit(
      EVENTS.QUESTION_MY_RESULT,
      game.getMyQuestionResult(id),
    );
  }
}

/** Data van het podium, voor iedereen gelijk. Ook gebruikt door game:sync na verversen. */
export function getPodiumPayload(game) {
  const ranking = game.getPublicRanking();
  return {
    top3: ranking.slice(0, 3),
    ranking,
    totalQuestions: game.totalQuestions,
  };
}

/**
 * Na de laatste vraag: eindstand naar iedereen, en daarna ieder zijn eigen resultaat.
 * Verwacht dat game.finish() al is aangeroepen.
 */
export function sendPodium(io, game) {
  // 1. Broadcast: één bericht naar de hele room. Host en spelers krijgen exact dezelfde lijst,
  //    dus podium (host) en eindstand (speler) kunnen het niet oneens zijn.
  io.to(gameRoom(game.code)).emit(EVENTS.GAME_PODIUM, getPodiumPayload(game));

  // 2. Persoonlijk: elke speler alleen zijn eigen resultaat, via zijn eigen room.
  for (const { id } of game.finalRanking) {
    io.to(playerRoom(game.code, id)).emit(
      EVENTS.PLAYER_RESULT,
      game.getPlayerResult(id),
    );
  }
}
