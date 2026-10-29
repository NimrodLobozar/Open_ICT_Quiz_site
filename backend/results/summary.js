/**
 * De cijfertegels op "Mijn account" (story 4): hoe vaak gespeeld, beste plaats, hoe vaak op het podium, % goed.
 * Losse functie zonder database, zodat je hem makkelijk kunt testen (backend/tests/summary.test.js).
 * De plaatsen (rank) komen uit de database: een momentopname van getRanking() op het podium,
 * dus ze kloppen altijd met de eindstand die de speler toen zag.
 *
 * @param {Array<{ rank: number, correctCount: number, questionCount: number }>} rows één rij per gespeelde ronde
 * @returns {{ played: number, bestRank: number | null, podiumCount: number, correctPercent: number | null }}
 *   bestRank en correctPercent zijn null als er nog niets gespeeld is (de pagina toont dan "–").
 */
export function summarizeResults(rows) {
  const played = rows.length

  const bestRank = played > 0 ? Math.min(...rows.map((row) => row.rank)) : null
  const podiumCount = rows.filter((row) => row.rank <= 3).length

  const totalQuestions = rows.reduce((sum, row) => sum + row.questionCount, 0)
  const totalCorrect = rows.reduce((sum, row) => sum + row.correctCount, 0)
  const correctPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null

  return { played, bestRank, podiumCount, correctPercent }
}
