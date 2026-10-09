import { PHASES } from '../game/phases.js'
import { getPodiumPayload } from './broadcast.js'

/**
 * Alles wat een client nodig heeft om het juiste scherm te tekenen, in één keer.
 * Na verversen of een weggevallen verbinding heeft de client de live-events gemist
 * (game:podium, player:result, …), dus die vraagt dit op met game:sync.
 */
export function buildSyncState(game, { role, playerId }) {
  const players = game.getLobbyPlayers()
  const state = {
    code: game.code,
    phase: game.phase,
    lobby: { players, playerCount: players.length, locked: game.locked },
    me: null,
    podium: null,
    result: null,
  }

  if (role === 'player') {
    const player = game.getPlayer(playerId)
    state.me = { playerId, nickname: player?.nickname ?? null }
  }

  // In de fase PODIUM: dezelfde data als game:podium en player:result.
  if (game.phase === PHASES.PODIUM) {
    state.podium = getPodiumPayload(game)
    if (role === 'player') state.result = game.getPlayerResult(playerId)
  }

  return state
}
