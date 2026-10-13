import { prisma } from './prisma.js'

/**
 * Slaat de eindstand van een game op: één GameSession met een GameResult per speler.
 * Verwacht dat game.finish() al is aangeroepen.
 */
export async function saveGameResults(game) {
  const record = game.toSessionRecord()
  if (!record) return null

  const { results, ...session } = record
  // Geneste create: Prisma zet de sessie en alle resultaten in één transactie.
  // Of alles staat erin, of niets; nooit een half scoreboard.
  return prisma.gameSession.create({
    data: { ...session, results: { create: results } },
  })
}

/**
 * Opslaan zonder dat het podium erop hoeft te wachten.
 * Ligt de database eruit, dan zien spelers gewoon hun eindstand; we loggen alleen de fout.
 */
export function saveGameResultsInBackground(game) {
  saveGameResults(game).catch((error) => {
    console.error(`Eindstand van game ${game.code} (ronde ${game.round}) niet opgeslagen:`, error)
  })
}
