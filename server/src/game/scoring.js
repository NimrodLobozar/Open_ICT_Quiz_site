// Puntentelling (zie docs/PROJECTPLAN.md hoofdstuk 13.1).
// Dit bestand is VOLLEDIG geïmplementeerd en getest (tests/scoring.test.js).

export const MAX_POINTS = 1000
export const MIN_POINTS_CORRECT = 500

/**
 * Punten voor één antwoord. Snel goed = 1000, op de valreep goed = 500, fout = 0.
 * @param {object} params
 * @param {boolean} params.correct
 * @param {number} params.responseTimeMs tijd sinds de vraag QUESTION_ACTIVE werd (gemeten op de server)
 * @param {number} params.timeLimitMs
 * @returns {number}
 */
export function calculatePoints({ correct, responseTimeMs, timeLimitMs }) {
  if (!correct) return 0
  if (!(timeLimitMs > 0)) return MAX_POINTS

  // Begrens tussen 0 en 1, zodat rare tijden (negatief, te laat) geen rare punten geven.
  const ratio = Math.min(Math.max(responseTimeMs / timeLimitMs, 0), 1)
  return Math.round(MAX_POINTS * (1 - ratio / 2))
}

// TODO(team): streak-bonus (+100 per opeenvolgend goed antwoord, max. +500)?
// Nog te beslissen, zie Open punten 5 in het projectplan.

/**
 * Rangschikt spelers op score (hoog → laag). Gelijke score = zelfde plek: 1, 1, 3 ...
 * De volgorde van spelers met gelijke score blijft zoals in de invoer.
 * @template {{ score: number }} T
 * @param {T[]} players
 * @returns {(T & { rank: number })[]}
 */
export function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  let previousRank = 0
  return sorted.map((player, index) => {
    // Zelfde score als de speler erboven → zelfde plek. Anders: plek = positie in de lijst.
    const sameAsAbove = index > 0 && sorted[index - 1].score === player.score
    const rank = sameAsAbove ? previousRank : index + 1
    previousRank = rank
    return { ...player, rank }
  })
}
