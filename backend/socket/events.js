// Alle Socket.IO-eventnamen op één plek.
// Een typfout in een string ('game:podum') geeft geen fout, het event komt gewoon nooit aan.
// Met een constante (EVENTS.GAME_PODIUM) krijg je bij een typfout wél meteen een fout.
//
// Let op: src/socket/events.js is een KOPIE hiervan voor de frontend.
// Verander je hier iets, pas dan ook die kopie en docs/SOCKET-EVENTS.md aan.
export const EVENTS = {
  // Client → server
  GAME_SYNC: "game:sync",
  HOST_START: "host:start", // lobby → vraag 1 (minimaal 2 spelers)
  HOST_NEXT: "host:next", // één stap verder: leestijd overslaan, tijd stoppen, volgende vraag
  HOST_RESTART: "host:restart",
  HOST_KICK_PLAYER: "host:kick-player", // alleen in de lobby: speler verwijderen
  HOST_LOCK: "host:lock", // alleen in de lobby: { locked } = nieuwe spelers weigeren of weer toelaten
  PLAYER_ANSWER: "player:answer",
  DEV_FINISH: "dev:finish", // alleen in development: quiz nep-afspelen en naar het podium

  // Server → client
  LOBBY_UPDATE: "lobby:update",
  QUESTION_SHOW: "question:show", // nieuwe vraag, of dezelfde vraag in een nieuwe fase (leestijd → antwoorden)
  QUESTION_PROGRESS: "question:progress", // alleen host: hoeveel spelers al geantwoord hebben
  QUESTION_END: "question:end", // goede antwoord, aantallen per antwoord en de tussenstand
  QUESTION_MY_RESULT: "question:my-result", // alleen naar één speler: goed/fout en punten erbij
  GAME_PODIUM: "game:podium",
  PLAYER_RESULT: "player:result",
  GAME_RESTARTED: "game:restarted",
};
