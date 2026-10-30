import { PHASES } from "../game/phases.js";
import { getPodiumPayload, getProgressPayload } from "./broadcast.js";

const QUESTION_PHASES = [
  PHASES.QUESTION_PREVIEW,
  PHASES.QUESTION_ACTIVE,
  PHASES.QUESTION_RESULT,
];

/**
 * Alles wat een client nodig heeft om het juiste scherm te tekenen, in één keer.
 * Na verversen of een weggevallen verbinding heeft de client de live-events gemist
 * (game:podium, player:result, …), dus die vraagt dit op met game:sync.
 */
export function buildSyncState(game, { role, playerId }) {
  const players = game.getLobbyPlayers();
  const state = {
    code: game.code,
    phase: game.phase,
    lobby: {
      players,
      playerCount: players.length,
      locked: game.locked,
      questionCount: game.questionCount,
      skillAverages: game.getSkillAverages(),
    },
    me: null,
    question: null, // zelfde als question:show
    progress: null, // zelfde als question:progress (alleen host)
    questionEnd: null, // zelfde als question:end
    myQuestionResult: null, // zelfde als question:my-result (alleen speler)
    myAnswer: null, // optionId die je bij de huidige vraag al koos (alleen speler)
    podium: null,
    result: null,
  };

  if (role === "player") {
    const player = game.getPlayer(playerId);
    state.me = {
      playerId,
      nickname: player?.nickname ?? null,
      score: player?.score ?? 0,
    };
  }

  // Tijdens de vraag-lus: dezelfde data als de live-events, zodat verversen hetzelfde scherm geeft.
  if (QUESTION_PHASES.includes(game.phase)) {
    state.question = game.getQuestionPayload();
    if (role === "host" && game.phase === PHASES.QUESTION_ACTIVE)
      state.progress = getProgressPayload(game);
    if (role === "player") state.myAnswer = game.getMyAnswer(playerId);
  }
  if (game.phase === PHASES.QUESTION_RESULT) {
    state.questionEnd = game.getQuestionEndPayload();
    if (role === "player")
      state.myQuestionResult = game.getMyQuestionResult(playerId);
  }

  // In de fase PODIUM: dezelfde data als game:podium en player:result.
  if (game.phase === PHASES.PODIUM) {
    state.podium = getPodiumPayload(game);
    if (role === "player") state.result = game.getPlayerResult(playerId);
  }

  return state;
}
