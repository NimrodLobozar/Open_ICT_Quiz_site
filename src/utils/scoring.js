// Punten voor één antwoord (projectplan 13.1).
// Gedeeld door server (Game.js) en de frontend-demo's, net als ranking.js: één plek voor de formule.
// De echte punten rekent altijd de server uit: alleen die weet wanneer je antwoord binnenkwam.

export const MAX_POINTS = 1000
export const MIN_POINTS_CORRECT = 500

// Niveaus van een vraag: 1 (makkelijk) t/m 5 (moeilijk), net als de vaardigheden van een speler (0 t/m 5).
export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5]

/**
 * Hoeveel keer de punten voor een vraag van dit niveau: 1 = ×1, 2 = ×1,25 … 5 = ×2.
 * Een moeilijke vraag goed hebben is meer waard. Geen niveau (null, bijv. een oude quiz) = ×1.
 * @param {number | null | undefined} difficulty
 */
export function difficultyMultiplier(difficulty) {
  if (!DIFFICULTY_LEVELS.includes(difficulty)) return 1
  return 1 + (difficulty - 1) * 0.25
}

/**
 * Goed: tussen 1000 (direct) en 500 (op de valreep), keer de factor van het niveau. Fout of geen antwoord: 0.
 * @param {{ correct: boolean, responseMs: number, timeLimitSec: number, difficulty?: number | null }} answer
 *   responseMs = tijd tussen het begin van de vraag (QUESTION_ACTIVE) en het antwoord.
 */
export function calculatePoints({ correct, responseMs, timeLimitSec, difficulty = null }) {
  if (!correct) return 0
  // Tussen 0 (direct) en 1 (tijd op). Buiten die grenzen afkappen, bijv. bij een antwoord net na de tijd.
  const part = Math.min(1, Math.max(0, responseMs / (timeLimitSec * 1000)))
  const base = MAX_POINTS - (MAX_POINTS - MIN_POINTS_CORRECT) * part
  return Math.round(base * difficultyMultiplier(difficulty))
}
