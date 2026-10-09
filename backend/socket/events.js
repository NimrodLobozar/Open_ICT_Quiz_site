// Alle Socket.IO-eventnamen op één plek.
// Een typfout in een string ('game:podum') geeft geen fout, het event komt gewoon nooit aan.
// Met een constante (EVENTS.GAME_PODIUM) krijg je bij een typfout wél meteen een fout.
//
// Let op: src/socket/events.js is een KOPIE hiervan voor de frontend.
// Verander je hier iets, pas dan ook die kopie en docs/SOCKET-EVENTS.md aan.
export const EVENTS = {
  // Client → server
  GAME_SYNC: 'game:sync',
  HOST_RESTART: 'host:restart', // TODO(jij): oefening, zie docs/SOCKET-IO-UITLEG.md
  DEV_FINISH: 'dev:finish', // alleen in development: quiz nep-afspelen en naar het podium

  // Server → client
  LOBBY_UPDATE: 'lobby:update',
  GAME_PODIUM: 'game:podium',
  PLAYER_RESULT: 'player:result',
  GAME_RESTARTED: 'game:restarted', // TODO(jij): oefening, zie docs/SOCKET-IO-UITLEG.md
}
