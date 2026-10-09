// KOPIE van backend/socket/events.js, voor de frontend.
// Verander je een naam, pas dan ook de backend-versie en docs/SOCKET-EVENTS.md aan.
export const EVENTS = {
  // Client → server
  GAME_SYNC: 'game:sync',
  HOST_RESTART: 'host:restart', // TODO(jij): oefening, zie docs/SOCKET-IO-UITLEG.md
  DEV_FINISH: 'dev:finish', // alleen in development

  // Server → client
  LOBBY_UPDATE: 'lobby:update',
  GAME_PODIUM: 'game:podium',
  PLAYER_RESULT: 'player:result',
  GAME_RESTARTED: 'game:restarted', // TODO(jij): oefening, zie docs/SOCKET-IO-UITLEG.md
}
