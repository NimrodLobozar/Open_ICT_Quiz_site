// Het persoonlijke resultaat van één speler op het eindscherm.
// Gedeeld door server (Game.js) en frontend-demo, net als ranking.js: één plek voor de berekening.

/**
 * @param {Array<{ id: number, nickname: string, score: number, correctCount: number, rank: number, isVerified: boolean }>} ranking
 *   Uitkomst van getRanking(), dus al gesorteerd van hoog naar laag.
 * @param {number} playerId
 * @param {number} totalQuestions
 */
export function buildPlayerResult(ranking, playerId, totalQuestions) {
  const me = ranking.find((row) => row.id === playerId)
  if (!me) return null

  // "Direct boven mij" = de laagste score die nog hoger is dan de mijne.
  // Bij gelijke scores is dat dus níet je buurman met dezelfde score, maar de plek daarboven.
  const above = ranking.filter((row) => row.score > me.score).at(-1)

  return {
    playerId: me.id,
    nickname: me.nickname,
    rank: me.rank,
    playerCount: ranking.length,
    totalScore: me.score,
    correctCount: me.correctCount,
    totalQuestions,
    // Op plek 1 is er niemand boven je: dan null, en toont de frontend een winstmelding.
    nextRank: above ? above.rank : null,
    pointsToNext: above ? above.score - me.score : null,
    isGuest: !me.isVerified,
  }
}
