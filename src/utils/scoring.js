// Punten voor één antwoord (projectplan 13.1).
// Gedeeld door server (Game.js) en de frontend-demo's, net als ranking.js: één plek voor de formule.
// De echte punten rekent altijd de server uit: alleen die weet wanneer je antwoord binnenkwam.

export const MAX_POINTS = 1000
export const MIN_POINTS_CORRECT = 500

/**
 * Goed: tussen 1000 (direct) en 500 (op de valreep). Fout of geen antwoord: 0.
 * @param {{ correct: boolean, responseMs: number, timeLimitSec: number }} answer
 *   responseMs = tijd tussen het begin van de vraag (QUESTION_ACTIVE) en het antwoord.
 */
export function calculatePoints({ correct, responseMs, timeLimitSec }) {
  if (!correct) return 0
  // Tussen 0 (direct) en 1 (tijd op). Buiten die grenzen afkappen, bijv. bij een antwoord net na de tijd.
  const part = Math.min(1, Math.max(0, responseMs / (timeLimitSec * 1000)))
  return Math.round(MAX_POINTS - (MAX_POINTS - MIN_POINTS_CORRECT) * part)
}
