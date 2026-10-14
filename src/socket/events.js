// KOPIE van backend/socket/events.js, voor de frontend.
// Verander je een naam, pas dan ook de backend-versie en docs/SOCKET-EVENTS.md aan.
export const EVENTS = {
  // Client → server
  GAME_SYNC: "game:sync",
  HOST_START: "host:start",
  HOST_NEXT: "host:next",
  HOST_RESTART: "host:restart",
  PLAYER_ANSWER: "player:answer",
  HOST_KICK_PLAYER: "host:kick-player", // alleen in de lobby
  HOST_LOCK: "host:lock", // alleen in de lobby
  DEV_FINISH: "dev:finish", // alleen in development

  // Server → client
  LOBBY_UPDATE: "lobby:update",
  QUESTION_SHOW: "question:show",
  QUESTION_PROGRESS: "question:progress", // alleen naar de host
  QUESTION_END: "question:end",
  QUESTION_MY_RESULT: "question:my-result", // alleen naar één speler
  GAME_PODIUM: "game:podium",
  PLAYER_RESULT: "player:result",
  GAME_RESTARTED: "game:restarted",
};
