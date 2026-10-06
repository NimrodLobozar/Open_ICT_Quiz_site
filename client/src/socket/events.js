// Alle Socket.IO-eventnamen. Gebruik NOOIT losse strings in de code.
// LET OP: dit is een KOPIE van server/src/constants/events.js.
// Wijzig je iets? Pas dan beide bestanden én docs/SOCKET-EVENTS.md aan in dezelfde PR.

// Client → Server
export const HOST_LOCK = 'host:lock'
export const HOST_KICK = 'host:kick'
export const HOST_START = 'host:start'
export const HOST_NEXT = 'host:next'
export const HOST_RESTART = 'host:restart'
export const HOST_END = 'host:end'
export const PLAYER_ANSWER = 'player:answer'
export const GAME_SYNC = 'game:sync'

// Server → Client
export const LOBBY_UPDATE = 'lobby:update'
export const GAME_PHASE = 'game:phase'
export const QUESTION_SHOW = 'question:show'
export const QUESTION_PROGRESS = 'question:progress'
export const QUESTION_END = 'question:end'
export const PLAYER_RESULT = 'player:result'
export const LEADERBOARD_SHOW = 'leaderboard:show'
export const GAME_PODIUM = 'game:podium'
export const GAME_RESTARTED = 'game:restarted'
export const GAME_CLOSED = 'game:closed'
export const ERROR = 'error'

// Alleen voor development (/dev/socket)
export const DEV_PING = 'dev:ping'
